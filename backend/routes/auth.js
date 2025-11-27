const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, LoginAttempt, IpAttempt } = require('../models');
const verifyToken = require('../middleware/auth');
const router = express.Router();
const { getClientIp, getIpLockStatus, checkAndUpdateIpAttempts } = require('../models/ipLock');


const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;  // fenêtre d’échecs
const LOCK_MINUTES = 30;    // blocage
const LOCKOUT_MINUTES = 30;
const SECRET_KEY = process.env.SECRET_KEY || "votre_super_secret_key_changez_moi_en_prod";

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function recordFailure(ipRow, now) {
  // Reset si la dernière tentative est hors fenêtre
  if (ipRow.last_attempt && (now - ipRow.last_attempt) > WINDOW_MINUTES * 60 * 1000) {
    ipRow.attempts_count = 0;
  }

  ipRow.attempts_count += 1;
  ipRow.last_attempt = now;

  if (ipRow.attempts_count >= MAX_ATTEMPTS) {
    ipRow.locked_until = addMinutes(now, LOCK_MINUTES);
  }

  await ipRow.save();
}

async function resetOnSuccess(ipRow, now) {
  ipRow.attempts_count = 0;
  ipRow.last_attempt = now;
  ipRow.locked_until = null;
  await ipRow.save();
}

// Helper function to check and update login attempts
async function checkAndUpdateAttempts(email, success) {
    let attempt = await LoginAttempt.findOne({ where: { email } });

    if (!attempt) {
        attempt = await LoginAttempt.create({ email });
    }

    const now = new Date();

    if (attempt.locked_until && attempt.locked_until > now) {
        const minutesRemaining = Math.ceil((attempt.locked_until - now) / (1000 * 60));
        return {
            locked: true,
            message: "Compte bloqué",
            locked_until: attempt.locked_until,
            minutes_remaining: minutesRemaining
        };
    }

    if (success) {
        attempt.attempts_count = 0;
        attempt.locked_until = null;
        await attempt.save();
        return { locked: false };
    } else {
        attempt.attempts_count += 1;
        attempt.last_attempt = now;

        if (attempt.attempts_count >= MAX_ATTEMPTS) {
            attempt.locked_until = new Date(now.getTime() + LOCKOUT_MINUTES * 60000);
            await attempt.save();
            return {
                locked: true,
                message: "Compte bloqué après 5 tentatives échouées",
                locked_until: attempt.locked_until,
                minutes_remaining: LOCKOUT_MINUTES
            };
        }

        await attempt.save();
        return { locked: false, attempts_remaining: MAX_ATTEMPTS - attempt.attempts_count };
    }
}

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const now = new Date();
    const ip = getClientIp(req);

    const lock = await getIpLockStatus(ip);
    if (lock.locked) {
    return res.status(403).json({
        detail: {
        message: lock.message,
        locked_until: lock.locked_until,
        minutes_remaining: lock.minutes_remaining
        }
    });
    }

    try {
        const user = await User.findOne({ where: { email } });

        // Check if user exists and password matches
        // Note: In Python verify_password(plain, hash) -> bcrypt.checkpw(plain.encode(), hash.encode())
        // Here we use bcryptjs.compare(plain, hash)
        const isValidPassword = user && await bcrypt.compare(password, user.password_hash);

        if (!user || !isValidPassword) {
            //const status = await checkAndUpdateAttempts(email, false);
            const status = await checkAndUpdateIpAttempts(ip, false);
            if (status.locked) {
                return res.status(403).json({
                    detail: {
                        message: status.message,
                        locked_until: status.locked_until,
                        minutes_remaining: status.minutes_remaining
                    }
                });
            }
            return res.status(401).json({
                detail: {
                    message: "Email ou mot de passe incorrect",
                    attempts_remaining: status.attempts_remaining
                }
            });
        }

        if (!user.is_active) {
            return res.status(403).json({ detail: "Compte désactivé" });
        }

        // Success
        //await checkAndUpdateAttempts(email, true);
        await checkAndUpdateIpAttempts(ip, true);

        const token = jwt.sign(
            { sub: user.id, email: user.email, role: user.role },
            SECRET_KEY,
            { expiresIn: '24h' } // 1440 minutes
        );

        res.json({
            access_token: token,
            token_type: "bearer",
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
                must_change_password: user.must_change_password
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Erreur serveur" });
    }
});

router.post('/change-password', verifyToken, async (req, res) => {
    const { current_password, new_password } = req.body;
    const user = req.user;

    try {
        const isValid = await bcrypt.compare(current_password, user.password_hash);
        if (!isValid) {
            return res.status(400).json({ detail: "Mot de passe actuel incorrect" });
        }

        const isSame = await bcrypt.compare(new_password, user.password_hash);
        if (isSame) {
            return res.status(400).json({ detail: "Le nouveau mot de passe doit être différent de l'ancien" });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        user.password_hash = hashedPassword;
        user.must_change_password = false;
        await user.save();

        res.json({ message: "Mot de passe modifié avec succès" });
    } catch (error) {
        res.status(500).json({ detail: "Erreur serveur" });
    }
});

router.post('/logout', verifyToken, (req, res) => {
    res.json({ message: "Déconnexion réussie" });
});

module.exports = router;
