const express = require("express");
const db = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");
const bcrypt = require("bcrypt");
const router = express.Router();

const verifierRoleEtudiant = (req, res, next) => {
    if (req.user.role !== "ETUDIANT") {
        return res.status(403).json({
            message: "Accès réservé aux étudiants."
        });
    }

    next();
};

router.get("/me", authMiddleware,verifierRoleEtudiant, async (req, res) => {
    const userId = req.user.userId;

    const [etudiants] = await db.query(
        `SELECT *
         FROM etudiants
         WHERE user_id = ?`,
        [userId]
    );

    res.json(etudiants);
});

router.put("/me", authMiddleware,verifierRoleEtudiant, async (req, res) => {
    const userId = req.user.userId;

    const {
        nom,
        prenom,
        telephone,
        niveau,
        formation
    } = req.body;

    // Vérifier que le nom et le prénom sont des chaînes de caractères
if (
    typeof nom !== "string" ||
    typeof prenom !== "string" ||
    !nom.trim() ||
    !prenom.trim()
) {
    return res.status(400).json({
        message: "Le nom et le prénom sont obligatoires."
    });
}

// Vérifier la longueur du nom et du prénom
if (nom.trim().length > 100 || prenom.trim().length > 100) {
    return res.status(400).json({
        message: "Le nom et le prénom ne doivent pas dépasser 100 caractères."
    });
}

// Vérifier le téléphone, s'il est renseigné
if (
    telephone !== undefined &&
    telephone !== null &&
    typeof telephone !== "string"
) {
    return res.status(400).json({
        message: "Le numéro de téléphone doit être une chaîne de caractères."
    });
}

if (typeof telephone === "string" && telephone.length > 30) {
    return res.status(400).json({
        message: "Le numéro de téléphone est trop long."
    });
}

// Vérifier le niveau et la formation
if (
    typeof niveau !== "string" ||
    !niveau.trim() ||
    typeof formation !== "string" ||
    !formation.trim()
) {
    return res.status(400).json({
        message: "Le niveau et la formation sont obligatoires."
    });
}

if (niveau.trim().length > 50 || formation.trim().length > 150) {
    return res.status(400).json({
        message: "Le niveau ou la formation dépasse la longueur autorisée."
    });
}

    await db.query(
        `UPDATE etudiants
         SET etudiant_nom = ?,
             etudiant_prenom = ?,
             etudiant_telephone = ?,
             etudiant_niveau = ?,
             etudiant_formation = ?
         WHERE user_id = ?`,
        [
            nom,
            prenom,
            telephone,
            niveau,
            formation,
            userId
        ]
    );

    res.json({
        message: "Profil modifié avec succès."
    });
});

router.put("/me/password", authMiddleware,verifierRoleEtudiant, async (req, res) => {

    const userId = req.user.userId;

    const {
        ancienMotDePasse,
        nouveauMotDePasse
    } = req.body;

    if (
    typeof ancienMotDePasse !== "string" ||
    typeof nouveauMotDePasse !== "string" ||
    !ancienMotDePasse ||
    !nouveauMotDePasse
) {
    return res.status(400).json({
        message: "Les deux mots de passe sont obligatoires."
    });
}

    if (nouveauMotDePasse.length < 8) {
        return res.status(400).json({
            message: "Le nouveau mot de passe doit contenir au moins 8 caractères."
        });
    }
    if (nouveauMotDePasse.length > 72) {
    return res.status(400).json({
        message: "Le nouveau mot de passe ne doit pas dépasser 72 caractères."
    });
}

    const [users] = await db.query(
        `SELECT user_mdp
         FROM users
         WHERE user_id = ?`,
        [userId]
    );

    if (users.length === 0) {
        return res.status(404).json({
            message: "Utilisateur introuvable."
        });
    }

    const motDePasseCorrect = await bcrypt.compare(
        ancienMotDePasse,
        users[0].user_mdp
    );

    if (!motDePasseCorrect) {
        return res.status(401).json({
            message: "Ancien mot de passe incorrect."
        });
    }

    const nouveauHash = await bcrypt.hash(
        nouveauMotDePasse,
        10
    );

    await db.query(
        `UPDATE users
         SET user_mdp = ?
         WHERE user_id = ?`,
        [nouveauHash, userId]
    );

    res.json({
        message: "Mot de passe modifié avec succès."
    });
});

module.exports = router;