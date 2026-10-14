const express = require("express");
const db = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

async function expressionDateSoutenance() {
    const [colonnes] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'soutenances'`
    );
    const nomsColonnes = new Set(colonnes.map(({ COLUMN_NAME }) => COLUMN_NAME));

    if (nomsColonnes.has("soutenance_date")) {
        return "(SELECT s.soutenance_date FROM soutenances s WHERE s.memoire_id = m.memoire_id LIMIT 1)";
    }
    if (nomsColonnes.has("date_soutenance")) {
        const heure = nomsColonnes.has("heure_soutenance")
            ? "COALESCE(s.heure_soutenance, '00:00:00')"
            : "'00:00:00'";
        return `(SELECT TIMESTAMP(s.date_soutenance, ${heure}) FROM soutenances s WHERE s.memoire_id = m.memoire_id LIMIT 1)`;
    }
    return "NULL";
}

router.get("/encadreurs", authMiddleware, async (req, res) => {
    try {
        // Vérifier que l'utilisateur connecté est un administrateur
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                message: "Accès réservé aux administrateurs."
            });
        }

        const [encadreurs] = await db.query(`
            SELECT
                e.encadreur_id,
                e.user_id,
                e.encadreur_matricule,
                e.encadreur_nom,
                e.encadreur_prenom,
                e.encadreur_telephone,
                e.encadreur_specialite,
                e.encadreur_grade,
                u.user_email
            FROM encadreurs e
            INNER JOIN users u ON e.user_id = u.user_id
            ORDER BY e.encadreur_nom ASC
        `);

        res.json(encadreurs);

    } catch (error) {
        console.error("Erreur lors de la récupération des encadreurs :", error);

        res.status(500).json({
            message: "Erreur serveur."
        });
    }
});

router.get("/stats", authMiddleware, async (req, res) => {
    try {
        // Vérifier que l'utilisateur est ADMIN
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                message: "Accès réservé aux administrateurs."
            });
        }

        // Nombre d'étudiants
        const [etudiants] = await db.query(
            "SELECT COUNT(*) AS total FROM etudiants"
        );

        // Nombre d'encadreurs
        const [encadreurs] = await db.query(
            "SELECT COUNT(*) AS total FROM encadreurs"
        );

        // Nombre de mémoires et de soutenances planifiées
        const [memoires] = await db.query(
            "SELECT COUNT(*) AS total FROM memoires"
        );
        const [soutenances] = await db.query(
            "SELECT COUNT(*) AS total FROM soutenances"
        );

        res.json({
            etudiants: etudiants[0].total,
            encadreurs: encadreurs[0].total,
            memoires: memoires[0].total,
            soutenances: soutenances[0].total
        });

    } catch (error) {
        console.error("Erreur statistiques admin :", error);

        res.status(500).json({
            message: "Erreur serveur."
        });
    }
});

router.post("/encadreurs", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                message: "Accès réservé aux administrateurs."
            });
        }

        const {
            matricule,
            nom,
            prenom,
            email,
            motDePasse,
            telephone,
            specialite,
            grade
        } = req.body;

        if (!matricule || !nom || !prenom || !email || !motDePasse) {
            return res.status(400).json({
                message: "Les champs obligatoires sont manquants."
            });
        }

        // Vérifier si l'email existe déjà
        const [users] = await db.query(
            "SELECT user_id FROM users WHERE user_email = ?",
            [email]
        );

        if (users.length > 0) {
            return res.status(409).json({
                message: "Cette adresse email est déjà utilisée."
            });
        }

        // Vérifier si le matricule existe déjà
        const [encadreursExistants] = await db.query(
            "SELECT encadreur_id FROM encadreurs WHERE encadreur_matricule = ?",
            [matricule]
        );

        if (encadreursExistants.length > 0) {
            return res.status(409).json({
                message: "Ce matricule est déjà utilisé."
            });
        }

        const bcrypt = require("bcrypt");

        const motDePasseHash = await bcrypt.hash(motDePasse, 10);

        // Créer le compte utilisateur
        const [userResult] = await db.query(
            `INSERT INTO users (user_email, user_mdp, user_role)
             VALUES (?, ?, 'ENCADREUR')`,
            [email, motDePasseHash]
        );

        const userId = userResult.insertId;

        // Créer le profil encadreur
        await db.query(
            `INSERT INTO encadreurs
            (
                user_id,
                encadreur_matricule,
                encadreur_nom,
                encadreur_prenom,
                encadreur_telephone,
                encadreur_specialite,
                encadreur_grade
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                matricule,
                nom,
                prenom,
                telephone,
                specialite,
                grade
            ]
        );

        res.status(201).json({
            message: "Encadreur ajouté avec succès."
        });

    } catch (error) {
        console.error("Erreur ajout encadreur :", error);

        res.status(500).json({
            message: "Erreur serveur."
        });
    }
});

router.get("/memoires", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                message: "Accès réservé aux administrateurs."
            });
        }

        const dateSoutenance = await expressionDateSoutenance();
        const [memoires] = await db.query(`
            SELECT
                m.memoire_id,
                m.memoire_titre AS titre,
                m.memoire_resume AS resume,
                m.memoire_niveau AS niveau,
                m.memoire_formation AS formation,
                m.annee_universitaire,
                (SELECT GROUP_CONCAT(CONCAT(e.etudiant_prenom, ' ', e.etudiant_nom) SEPARATOR ', ')
                 FROM memoire_etudiants me JOIN etudiants e ON e.etudiant_id = me.etudiant_id
                 WHERE me.memoire_id = m.memoire_id) AS etudiants,
                (SELECT GROUP_CONCAT(CONCAT(en.encadreur_prenom, ' ', en.encadreur_nom, ' (', me.memoire_role, ')') SEPARATOR ', ')
                 FROM memoire_encadreurs me JOIN encadreurs en ON en.encadreur_id = me.encadreur_id
                 WHERE me.memoire_id = m.memoire_id) AS encadreurs,
                (SELECT COUNT(*) FROM versions_memoires v WHERE v.memoire_id = m.memoire_id) AS nombre_versions,
                ${dateSoutenance} AS date_soutenance
            FROM memoires m
            ORDER BY m.memoire_id DESC
        `);

        res.json(memoires);
    } catch (erreur) {
        console.error("Erreur récupération mémoires :", erreur);

        res.status(500).json({
            message: "Erreur lors de la récupération des mémoires."
        });
    }
});


router.get("/affectations", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Accès réservé aux administrateurs." });
        }
        const [affectations] = await db.query(`
            SELECT me.memoire_id, me.encadreur_id, me.memoire_role,
                   m.memoire_titre AS titre,
                   e.encadreur_nom, e.encadreur_prenom, e.encadreur_matricule
            FROM memoire_encadreurs me
            INNER JOIN memoires m ON m.memoire_id = me.memoire_id
            INNER JOIN encadreurs e ON e.encadreur_id = me.encadreur_id
            ORDER BY m.memoire_titre, me.memoire_role
        `);
        return res.json(affectations);
    } catch (error) {
        console.error("Erreur récupération affectations :", error);
        return res.status(500).json({ message: "Impossible de charger les affectations." });
    }
});

router.delete("/affectations/:memoireId/:encadreurId", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Accès réservé aux administrateurs." });
        }
        const memoireId = Number(req.params.memoireId);
        const encadreurId = Number(req.params.encadreurId);
        if (!Number.isSafeInteger(memoireId) || memoireId <= 0 || !Number.isSafeInteger(encadreurId) || encadreurId <= 0) {
            return res.status(400).json({ message: "Identifiants d'affectation invalides." });
        }
        const [result] = await db.query(
            "DELETE FROM memoire_encadreurs WHERE memoire_id = ? AND encadreur_id = ?",
            [memoireId, encadreurId]
        );
        if (!result.affectedRows) return res.status(404).json({ message: "Affectation introuvable." });
        return res.json({ message: "Affectation supprimée avec succès." });
    } catch (error) {
        console.error("Erreur suppression affectation :", error);
        return res.status(500).json({ message: "Impossible de supprimer l'affectation." });
    }
});

router.post("/affectations", authMiddleware, async (req, res) => {
    try {
        // Vérifier que l'utilisateur est administrateur
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                message: "Accès réservé aux administrateurs."
            });
        }

        const { memoireId, encadreurId, role } = req.body;

        // Vérifier les champs
        if (!memoireId || !encadreurId || !role) {
            return res.status(400).json({
                message: "Le mémoire, l'encadreur et le rôle sont obligatoires."
            });
        }

        // Vérifier que le mémoire existe
        const [memoires] = await db.query(
            "SELECT memoire_id FROM memoires WHERE memoire_id = ?",
            [memoireId]
        );

        if (memoires.length === 0) {
            return res.status(404).json({
                message: "Mémoire introuvable."
            });
        }

        // Vérifier que l'encadreur existe
        const [encadreurs] = await db.query(
            "SELECT encadreur_id FROM encadreurs WHERE encadreur_id = ?",
            [encadreurId]
        );

        if (encadreurs.length === 0) {
            return res.status(404).json({
                message: "Encadreur introuvable."
            });
        }

        // Vérifier si l'affectation existe déjà
        const [affectations] = await db.query(
            `SELECT *
             FROM memoire_encadreurs
             WHERE memoire_id = ?
             AND encadreur_id = ?`,
            [memoireId, encadreurId]
        );

        if (affectations.length > 0) {
            return res.status(409).json({
                message: "Cet encadreur est déjà affecté à ce mémoire."
            });
        }

        // Créer l'affectation
        await db.query(
            `INSERT INTO memoire_encadreurs
             (memoire_id, encadreur_id, memoire_role)
             VALUES (?, ?, ?)`,
            [memoireId, encadreurId, role]
        );

        res.status(201).json({
            message: "Encadreur affecté au mémoire avec succès."
        });

    } catch (error) {
        console.error("Erreur lors de l'affectation :", error);

        res.status(500).json({
            message: "Erreur serveur."
        });
    }
});

module.exports = router;