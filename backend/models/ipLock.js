const { IpAttempt } = require('../models');

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 30;
const WINDOW_MINUTES = 15; // optionnel mais conseillé

function addMinutes(d, minutes) {
  return new Date(d.getTime() + minutes * 60 * 1000);
}

function minutesRemaining(until, now) {
  return Math.max(0, Math.ceil((until - now) / 60000));
}

function normalizeIp(ip) {
  return ip && ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

function getClientIp(req) {
  let ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip;

  return normalizeIp(ip);
}


// Lecture seule : ne modifie rien
async function getIpLockStatus(ip) {
  const now = new Date();
  const row = await IpAttempt.findOne({ where: { ip } });

  if (row?.locked_until && row.locked_until > now) {
    return {
      locked: true,
      message: "Trop de tentatives. Réessaie plus tard.",
      locked_until: row.locked_until,
      minutes_remaining: minutesRemaining(row.locked_until, now),
    };
  }
  return { locked: false };
}

// Update : échec => incrémente / succès => reset
async function checkAndUpdateIpAttempts(ip, success) {
  const now = new Date();

  const [row] = await IpAttempt.findOrCreate({
    where: { ip },
    defaults: { ip, attempts_count: 0, last_attempt: now, locked_until: null }
  });

  // succès => reset complet
  if (success) {
    row.attempts_count = 0;
    row.last_attempt = now;
    row.locked_until = null;
    await row.save();
    return { locked: false, attempts_remaining: MAX_ATTEMPTS };
  }

  // déjà lockée => renvoyer état sans modifier
  if (row.locked_until && row.locked_until > now) {
    return {
      locked: true,
      message: "Trop de tentatives. Réessaie plus tard.",
      locked_until: row.locked_until,
      minutes_remaining: minutesRemaining(row.locked_until, now),
      attempts_remaining: 0
    };
  }

  // reset fenêtre si dernière tentative trop ancienne
  if (row.last_attempt && (now - row.last_attempt) > WINDOW_MINUTES * 60 * 1000) {
    row.attempts_count = 0;
  }

  row.attempts_count += 1;
  row.last_attempt = now;

  // lock si seuil atteint
  if (row.attempts_count >= MAX_ATTEMPTS) {
    row.locked_until = addMinutes(now, LOCK_MINUTES);
    await row.save();
    return {
      locked: true,
      message: "Trop de tentatives. Réessaie plus tard.",
      locked_until: row.locked_until,
      minutes_remaining: LOCK_MINUTES,
      attempts_remaining: 0
    };
  }

  await row.save();
  return {
    locked: false,
    attempts_remaining: Math.max(0, MAX_ATTEMPTS - row.attempts_count)
  };
}

module.exports = {
  getClientIp,
  getIpLockStatus,
  checkAndUpdateIpAttempts
};
