const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, LoginAttempt } = require('../models');
const verifyToken = require('../middleware/auth');
const router = express.Router();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;
const SECRET_KEY = process.env.SECRET_KEY || "votre_super_secret_key_changez_moi_en_prod";

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

// Helper function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to validate password strength
function isValidPassword(password) {
    return password && password.length >= 8;
}

router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validation des champs requis
        if (!email || !password) {
            return res.status(400).json({
                detail: "Email et mot de passe requis"
            });
        }

        // Validation format email
        if (!isValidEmail(email)) {
            return res.status(400).json({
                detail: "Format d'email invalide"
            });
        }

        // Validation force du mot de passe
        if (!isValidPassword(password)) {
            return res.status(400).json({
                detail: "Le mot de passe doit contenir au moins 8 caractères"
            });
        }

        // Vérification que l'email n'existe pas déjà
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                detail: "Cet email est déjà utilisé"
            });
        }

        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Création de l'utilisateur avec rôle par défaut JOUEUR
        const newUser = await User.create({
            email,
            password_hash: hashedPassword,
            role: 'JOUEUR',
            is_active: true,
            must_change_password: false
        });

        // Génération automatique du JWT
        const token = jwt.sign(
            { sub: newUser.id, email: newUser.email, role: newUser.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            access_token: token,
            token_type: "bearer",
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                is_active: newUser.is_active,
                must_change_password: newUser.must_change_password
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Erreur serveur" });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        // Check if user exists and password matches
        // Note: In Python verify_password(plain, hash) -> bcrypt.checkpw(plain.encode(), hash.encode())
        // Here we use bcryptjs.compare(plain, hash)
        const isValidPassword = user && await bcrypt.compare(password, user.password_hash);

        if (!user || !isValidPassword) {
            const status = await checkAndUpdateAttempts(email, false);
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
        await checkAndUpdateAttempts(email, true);

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
