const express = require("express");
const db = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const STATUTS = ["PLANIFIEE", "REALISEE", "ANNULEE"];

async function lireColonnesSoutenance() {
    const [rows] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'soutenances'`
    );
    return new Set(rows.map(({ COLUMN_NAME }) => COLUMN_NAME));
}

function expressionsSoutenance(colonnes) {
    let date;
    if (colonnes.has("soutenance_date")) {
        date = "s.soutenance_date";
    } else if (colonnes.has("date_soutenance")) {
        const heure = colonnes.has("heure_soutenance")
            ? "COALESCE(s.heure_soutenance, '00:00:00')"
            : "'00:00:00'";
        date = `TIMESTAMP(s.date_soutenance, ${heure})`;
    } else {
        date = "NULL";
    }

    const colonne = (moderne, ancienne) => {
        if (colonnes.has(moderne)) return `s.${moderne}`;
        if (ancienne && colonnes.has(ancienne)) return `s.${ancienne}`;
        return "NULL";
    };
    return {
        date,
        lieu: colonne("soutenance_lieu", "lieu"),
        jury: colonne("soutenance_jury", null),
        statut: colonne("soutenance_statut", null),
        commentaire: colonne("soutenance_commentaire", null),
        note: colonne("note", null),
        mention: colonne("mention", null),
    };
}

function champsSoutenance(colonnes, valeur) {
    const [date, heure] = valeur.date.split(" ");
    const champs = [["memoire_id", valeur.memoireId]];
    if (colonnes.has("soutenance_date")) {
        champs.push(["soutenance_date", valeur.date]);
    } else if (colonnes.has("date_soutenance")) {
        champs.push(["date_soutenance", date]);
        if (colonnes.has("heure_soutenance")) champs.push(["heure_soutenance", heure]);
    } else {
        throw new Error("La table soutenances ne contient aucune colonne de date compatible.");
    }
    const ajouter = (moderne, ancienne, valeurChamp) => {
        if (colonnes.has(moderne)) champs.push([moderne, valeurChamp]);
        else if (ancienne && colonnes.has(ancienne)) champs.push([ancienne, valeurChamp]);
    };
    ajouter("soutenance_lieu", "lieu", valeur.lieu);
    ajouter("soutenance_jury", null, valeur.jury);
    ajouter("soutenance_statut", null, valeur.statut);
    ajouter("soutenance_commentaire", null, valeur.commentaire);
    return champs;
}

function verifierAdmin(req, res, next) {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Accès réservé aux administrateurs." });
    }
    next();
}

function validerSoutenance(body) {
    const { memoireId, date, lieu, jury = "", statut = "PLANIFIEE", commentaire = "" } = body || {};
    const id = Number(memoireId);
    if (!Number.isSafeInteger(id) || id <= 0) return { erreur: "Veuillez choisir un mémoire valide." };
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
        return { erreur: "Veuillez saisir une date et une heure valides." };
    }
    if (typeof lieu !== "string" || !lieu.trim() || lieu.trim().length > 255) {
        return { erreur: "Le lieu est obligatoire et ne doit pas dépasser 255 caractères." };
    }
    if (typeof jury !== "string" || jury.length > 5000 || typeof commentaire !== "string" || commentaire.length > 5000) {
        return { erreur: "Le jury ou le commentaire est trop long ou invalide." };
    }
    if (!STATUTS.includes(statut)) return { erreur: "Le statut de la soutenance est invalide." };
    return {
        valeur: {
            memoireId: id,
            date: date.replace("T", " ") + ":00",
            lieu: lieu.trim(),
            jury: jury.trim() || null,
            statut,
            commentaire: commentaire.trim() || null
        }
    };
}

// Calendrier visible par l'étudiant propriétaire ou l'encadreur affecté.
router.get("/mes", authMiddleware, async (req, res) => {
    try {
        const colonnes = await lireColonnesSoutenance();
        const expressions = expressionsSoutenance(colonnes);
        const userId = req.user.userId;
        let relationSql;
        if (req.user.role === "ETUDIANT") {
            relationSql = `EXISTS (
                SELECT 1 FROM memoire_etudiants me
                INNER JOIN etudiants e ON e.etudiant_id = me.etudiant_id
                WHERE me.memoire_id = m.memoire_id AND e.user_id = ?
            )`;
        } else if (req.user.role === "ENCADREUR") {
            relationSql = `EXISTS (
                SELECT 1 FROM memoire_encadreurs me
                INNER JOIN encadreurs e ON e.encadreur_id = me.encadreur_id
                WHERE me.memoire_id = m.memoire_id AND e.user_id = ?
            )`;
        } else {
            return res.status(403).json({ message: "Cette vue est réservée aux étudiants et aux encadreurs." });
        }

        const [rows] = await db.query(`
            SELECT s.soutenance_id, s.memoire_id,
                   DATE_FORMAT(${expressions.date}, '%Y-%m-%dT%H:%i') AS date,
                   ${expressions.lieu} AS lieu, ${expressions.jury} AS jury,
                   ${expressions.statut} AS statut, ${expressions.commentaire} AS commentaire,
                   ${expressions.note} AS note, ${expressions.mention} AS mention,
                   m.memoire_titre AS titre
            FROM soutenances s
            INNER JOIN memoires m ON m.memoire_id = s.memoire_id
            WHERE ${relationSql}
            ORDER BY ${expressions.date} ASC`, [userId]);
        return res.json(rows);
    } catch (error) {
        console.error("Erreur chargement des soutenances personnelles :", error);
        return res.status(500).json({ message: "Impossible de charger les soutenances." });
    }
});

// Liste administrative des soutenances.
router.get("/", authMiddleware, verifierAdmin, async (req, res) => {
    try {
        const colonnes = await lireColonnesSoutenance();
        const expressions = expressionsSoutenance(colonnes);
        const [rows] = await db.query(`
            SELECT s.soutenance_id, s.memoire_id,
                   DATE_FORMAT(${expressions.date}, '%Y-%m-%dT%H:%i') AS date,
                   ${expressions.lieu} AS lieu, ${expressions.jury} AS jury,
                   ${expressions.statut} AS statut, ${expressions.commentaire} AS commentaire,
                   ${expressions.note} AS note, ${expressions.mention} AS mention,
                   m.memoire_titre AS titre, m.memoire_formation AS formation,
                   (SELECT GROUP_CONCAT(CONCAT(e.etudiant_prenom, ' ', e.etudiant_nom) SEPARATOR ', ')
                    FROM memoire_etudiants me JOIN etudiants e ON e.etudiant_id = me.etudiant_id
                    WHERE me.memoire_id = m.memoire_id) AS etudiants
            FROM soutenances s
            INNER JOIN memoires m ON m.memoire_id = s.memoire_id
            ORDER BY ${expressions.date} DESC`);
        return res.json(rows);
    } catch (error) {
        console.error("Erreur liste des soutenances :", error);
        return res.status(500).json({ message: "Impossible de charger les soutenances." });
    }
});

router.post("/", authMiddleware, verifierAdmin, async (req, res) => {
    const validation = validerSoutenance(req.body);
    if (validation.erreur) return res.status(400).json({ message: validation.erreur });
    const { memoireId, date, lieu, jury, statut, commentaire } = validation.valeur;
    try {
        const colonnes = await lireColonnesSoutenance();
        const [memoires] = await db.query("SELECT memoire_id FROM memoires WHERE memoire_id = ?", [memoireId]);
        if (!memoires.length) return res.status(404).json({ message: "Mémoire introuvable." });
        const [existing] = await db.query("SELECT soutenance_id FROM soutenances WHERE memoire_id = ?", [memoireId]);
        if (existing.length) return res.status(409).json({ message: "Une soutenance est déjà planifiée pour ce mémoire. Modifiez-la dans la liste." });
        const champs = champsSoutenance(colonnes, validation.valeur);
        const noms = champs.map(([nom]) => nom);
        const [result] = await db.query(
            `INSERT INTO soutenances (${noms.join(", ")}) VALUES (${noms.map(() => "?").join(", ")})`,
            champs.map(([, valeurChamp]) => valeurChamp)
        );
        return res.status(201).json({ message: "Soutenance planifiée avec succès.", soutenanceId: result.insertId });
    } catch (error) {
        console.error("Erreur création soutenance :", error);
        if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Une soutenance existe déjà pour ce mémoire." });
        return res.status(500).json({ message: "Impossible d'enregistrer la soutenance." });
    }
});

router.put("/:id", authMiddleware, verifierAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ message: "Identifiant invalide." });
    const validation = validerSoutenance(req.body);
    if (validation.erreur) return res.status(400).json({ message: validation.erreur });
    const { memoireId, date, lieu, jury, statut, commentaire } = validation.valeur;
    try {
        const colonnes = await lireColonnesSoutenance();
        const [rows] = await db.query("SELECT soutenance_id FROM soutenances WHERE soutenance_id = ?", [id]);
        if (!rows.length) return res.status(404).json({ message: "Soutenance introuvable." });
        const [duplicates] = await db.query("SELECT soutenance_id FROM soutenances WHERE memoire_id = ? AND soutenance_id <> ?", [memoireId, id]);
        if (duplicates.length) return res.status(409).json({ message: "Une autre soutenance est déjà liée à ce mémoire." });
        const [memoires] = await db.query("SELECT memoire_id FROM memoires WHERE memoire_id = ?", [memoireId]);
        if (!memoires.length) return res.status(404).json({ message: "Mémoire introuvable." });
        const champs = champsSoutenance(colonnes, validation.valeur);
        const affectations = champs.map(([nom]) => `${nom} = ?`);
        await db.query(
            `UPDATE soutenances SET ${affectations.join(", ")} WHERE soutenance_id = ?`,
            [...champs.map(([, valeurChamp]) => valeurChamp), id]
        );
        return res.json({ message: "Soutenance mise à jour avec succès." });
    } catch (error) {
        console.error("Erreur mise à jour soutenance :", error);
        return res.status(500).json({ message: "Impossible de modifier la soutenance." });
    }
});

router.delete("/:id", authMiddleware, verifierAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ message: "Identifiant invalide." });
    try {
        const [result] = await db.query("DELETE FROM soutenances WHERE soutenance_id = ?", [id]);
        if (!result.affectedRows) return res.status(404).json({ message: "Soutenance introuvable." });
        return res.json({ message: "Soutenance supprimée." });
    } catch (error) {
        console.error("Erreur suppression soutenance :", error);
        return res.status(500).json({ message: "Impossible de supprimer la soutenance." });
    }
});

module.exports = router;
