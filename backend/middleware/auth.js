const jwt = require('jsonwebtoken');
const { User } = require('../models');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ detail: "Non authentifié" });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY || "votre_super_secret_key_changez_moi_en_prod");
        const user = await User.findByPk(decoded.sub);

        if (!user) {
            return res.status(401).json({ detail: "Utilisateur non trouvé" });
        }

        if (!user.is_active) {
            return res.status(403).json({ detail: "Compte désactivé" });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ detail: "Token invalide" });
    }
};

module.exports = verifyToken;
