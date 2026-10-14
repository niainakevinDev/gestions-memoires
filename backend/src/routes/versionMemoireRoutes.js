
const express = require("express");
const db = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = express.Router();

const verifierRoleEtudiant = (req, res, next) => {
    if (req.user.role !== "ETUDIANT") {
        return res.status(403).json({
            message: "Accès réservé aux étudiants."
        });
    }

    next();
};

// Dossier de stockage situé dans backend/storage/memoires
const dossierStockage = path.resolve(
    __dirname,
    "../../storage/memoires"
);

fs.mkdirSync(dossierStockage, { recursive: true });

// Configuration de Multer
const stockage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, dossierStockage);
    },

    filename: (req, file, cb) => {
        const nomUnique = `${Date.now()}-${crypto.randomUUID()}.pdf`;
        cb(null, nomUnique);
    }
});

const upload = multer({
    storage: stockage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (
            extension !== ".pdf" ||
            file.mimetype !== "application/pdf"
        ) {
            return cb(
                new Error("Seuls les fichiers PDF sont autorisés.")
            );
        }

        cb(null, true);
    }
});

// Soumettre une nouvelle version du mémoire
router.post(
    "/",
    authMiddleware,verifierRoleEtudiant,
    (req, res, next) => {
        upload.single("fichier")(req, res, (erreur) => {
            if (erreur) {
                if (erreur instanceof multer.MulterError) {
                    if (erreur.code === "LIMIT_FILE_SIZE") {
                        return res.status(400).json({
                            message: "Le fichier ne doit pas dépasser 10 Mo."
                        });
                    }

                    return res.status(400).json({
                        message: "Erreur lors de l'envoi du fichier."
                    });
                }

                return res.status(400).json({
                    message: erreur.message
                });
            }

            next();
        });
    },
    async (req, res) => {
        let cheminFichier = null;

        try {
            const userId = req.user.userId;
            const { memoireId, commentaireEtudiant } = req.body;

            if (!memoireId) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    message: "Le mémoire est obligatoire."
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    message: "Veuillez sélectionner un fichier PDF."
                });
            }
            cheminFichier = req.file.path;
            // Vérifier la signature réelle du fichier PDF
const descripteur = fs.openSync(cheminFichier, "r");

let signature;

try {
    signature = Buffer.alloc(5);

    fs.readSync(
        descripteur,
        signature,
        0,
        5,
        0
    );
} finally {
    fs.closeSync(descripteur);
}

if (signature.toString("ascii") !== "%PDF-") {
    fs.unlinkSync(cheminFichier);
    cheminFichier = null;

    return res.status(400).json({
        message: "Le fichier envoyé n'est pas un PDF valide."
    });
}

            

            // Valider l'identifiant du mémoire
const idMemoire = Number(memoireId);

if (!Number.isSafeInteger(idMemoire) || idMemoire <= 0) {
    if (cheminFichier && fs.existsSync(cheminFichier)) {
        fs.unlinkSync(cheminFichier);
        cheminFichier = null;
    }

    return res.status(400).json({
        message: "L'identifiant du mémoire est invalide."
    });
}

// Obtenir une connexion dédiée à la transaction
const connexion = await db.getConnection();

try {
    await connexion.beginTransaction();

    // 1. Vérifier l'accès de l'étudiant et verrouiller le mémoire
    const [memoires] = await connexion.query(
        `SELECT m.memoire_id
         FROM memoires m
         INNER JOIN memoire_etudiants me
             ON me.memoire_id = m.memoire_id
         INNER JOIN etudiants e
             ON e.etudiant_id = me.etudiant_id
         WHERE m.memoire_id = ?
           AND e.user_id = ?
         FOR UPDATE`,
        [idMemoire, userId]
    );

    if (memoires.length === 0) {
        await connexion.rollback();

        if (cheminFichier && fs.existsSync(cheminFichier)) {
            fs.unlinkSync(cheminFichier);
            cheminFichier = null;
        }

        return res.status(404).json({
            message: "Mémoire introuvable ou accès non autorisé."
        });
    }

    // 2. Calculer le prochain numéro dans la transaction
    const [versions] = await connexion.query(
        `SELECT MAX(numero_version) AS derniere_version
         FROM versions_memoires
         WHERE memoire_id = ?`,
        [idMemoire]
    );

    const nouvelleVersion =
        Number(versions[0].derniere_version || 0) + 1;

    // 3. Construire le chemin relatif du fichier
    const cheminRelatif = path.posix.join(
        "storage",
        "memoires",
        path.basename(cheminFichier)
    );

    // 4. Enregistrer la nouvelle version
    const [resultat] = await connexion.query(
        `INSERT INTO versions_memoires (
            memoire_id,
            numero_version,
            commentaire_etudiant,
            version_statut,
            chemin_fichier
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
            idMemoire,
            nouvelleVersion,
            typeof commentaireEtudiant === "string"
                ? commentaireEtudiant.trim() || null
                : null,
            "SOUMISE",
            cheminRelatif
        ]
    );

    // 5. Confirmer l'enregistrement
    await connexion.commit();

    return res.status(201).json({
        message: "Version soumise avec succès.",
        versionId: resultat.insertId,
        numeroVersion: nouvelleVersion,
        cheminFichier: cheminRelatif
    });

} catch (erreurTransaction) {
    try {
        await connexion.rollback();
    } catch (erreurRollback) {
        console.error(
            "Erreur lors de l'annulation de la transaction :",
            erreurRollback
        );
    }

    throw erreurTransaction;

} finally {
    connexion.release();
}

            

        } catch (erreur) {
            // Éviter de conserver un fichier si l'enregistrement échoue
            if (cheminFichier && fs.existsSync(cheminFichier)) {
                fs.unlinkSync(cheminFichier);
            }

            console.error(
                "Erreur lors de la soumission de la version :",
                erreur
            );

            res.status(500).json({
                message: "Erreur interne lors de la soumission."
            });
        }
    }
);

// Consulter les versions d'un mémoire
router.get("/memoire/:memoireId", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { memoireId } = req.params;

        // Autoriser le propriétaire étudiant ou un encadreur affecté
        const [acces] = await db.query(
            `SELECT m.memoire_id
             FROM memoires m
             WHERE m.memoire_id = ?
               AND (
                    EXISTS (
                        SELECT 1
                        FROM memoire_etudiants me
                        INNER JOIN etudiants e
                            ON e.etudiant_id = me.etudiant_id
                        WHERE me.memoire_id = m.memoire_id
                          AND e.user_id = ?
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM memoire_encadreurs me
                        INNER JOIN encadreurs en
                            ON en.encadreur_id = me.encadreur_id
                        WHERE me.memoire_id = m.memoire_id
                          AND en.user_id = ?
                    )
               )`,
            [memoireId, userId, userId]
        );

        if (acces.length === 0) {
            return res.status(403).json({
                message: "Vous n'avez pas accès à ce mémoire."
            });
        }

        const [versions] = await db.query(
            `SELECT
                version_id,
                memoire_id,
                numero_version,
                commentaire_etudiant,
                version_statut,
                created_at,
                chemin_fichier
             FROM versions_memoires
             WHERE memoire_id = ?
             ORDER BY numero_version DESC`,
            [memoireId]
        );

        res.json(versions);
    } catch (erreur) {
        console.error("Erreur de récupération des versions :", erreur);

        res.status(500).json({
            message: "Erreur interne du serveur."
        });
    }
});

// Consulter les informations d'une version
router.get("/:versionId", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { versionId } = req.params;

        const [versions] = await db.query(
            `SELECT v.*
             FROM versions_memoires v
             WHERE v.version_id = ?
               AND (
                    EXISTS (
                        SELECT 1
                        FROM memoire_etudiants me
                        INNER JOIN etudiants e
                            ON e.etudiant_id = me.etudiant_id
                        WHERE me.memoire_id = v.memoire_id
                          AND e.user_id = ?
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM memoire_encadreurs me
                        INNER JOIN encadreurs en
                            ON en.encadreur_id = me.encadreur_id
                        WHERE me.memoire_id = v.memoire_id
                          AND en.user_id = ?
                    )
               )`,
            [versionId, userId, userId]
        );

        if (versions.length === 0) {
            return res.status(404).json({
                message: "Version introuvable ou accès non autorisé."
            });
        }

        res.json(versions[0]);
    } catch (erreur) {
        console.error("Erreur de récupération de la version :", erreur);

        res.status(500).json({
            message: "Erreur interne du serveur."
        });
    }
});

// Modifier le statut d'une version du mémoire
router.patch("/:versionId/statut", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { versionId } = req.params;
        const { statut } = req.body;

        // Vérifier que le statut est autorisé
        const statutsAutorises = [
    "SOUMISE",
    "EN_REVISION",
    "VALIDEE",
    "REJETEE"
];

        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({
                message: "Le statut fourni n'est pas valide."
            });
        }

        // Vérifier que l'utilisateur est un encadreur
        const [encadreurs] = await db.query(
            `SELECT encadreur_id
             FROM encadreurs
             WHERE user_id = ?`,
            [userId]
        );

        if (encadreurs.length === 0) {
            return res.status(403).json({
                message: "Seuls les encadreurs peuvent modifier le statut."
            });
        }

        const encadreurId = encadreurs[0].encadreur_id;

        // Vérifier que l'encadreur est affecté au mémoire
        const [versions] = await db.query(
            `SELECT v.version_id
             FROM versions_memoires v
             INNER JOIN memoire_encadreurs me
                ON me.memoire_id = v.memoire_id
             WHERE v.version_id = ?
               AND me.encadreur_id = ?`,
            [versionId, encadreurId]
        );

        if (versions.length === 0) {
            return res.status(404).json({
                message: "Version introuvable ou accès non autorisé."
            });
        }

        // Enregistrer le nouveau statut
        await db.query(
            `UPDATE versions_memoires
             SET version_statut = ?
             WHERE version_id = ?`,
            [statut, versionId]
        );

        return res.status(200).json({
            message: "Statut de la version modifié avec succès.",
            versionId: Number(versionId),
            statut
        });

    } catch (erreur) {
        console.error("Erreur lors de la modification du statut :", erreur);

        return res.status(500).json({
            message: "Erreur interne du serveur."
        });
    }
});


// Télécharger une version PDF
router.get("/:versionId/fichier", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { versionId } = req.params;

        const [versions] = await db.query(
            `SELECT v.chemin_fichier
             FROM versions_memoires v
             WHERE v.version_id = ?
               AND (
                    EXISTS (
                        SELECT 1
                        FROM memoire_etudiants me
                        INNER JOIN etudiants e
                            ON e.etudiant_id = me.etudiant_id
                        WHERE me.memoire_id = v.memoire_id
                          AND e.user_id = ?
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM memoire_encadreurs me
                        INNER JOIN encadreurs en
                            ON en.encadreur_id = me.encadreur_id
                        WHERE me.memoire_id = v.memoire_id
                          AND en.user_id = ?
                    )
               )`,
            [versionId, userId, userId]
        );

        if (versions.length === 0) {
            return res.status(404).json({
                message: "Fichier introuvable ou accès non autorisé."
            });
        }

        const nomFichier = path.basename(versions[0].chemin_fichier);
        const cheminAbsolu = path.join(dossierStockage, nomFichier);

        if (!fs.existsSync(cheminAbsolu)) {
            return res.status(404).json({
                message: "Le fichier PDF n'existe plus dans le stockage."
            });
        }

        res.download(cheminAbsolu);
    } catch (erreur) {
        console.error("Erreur de téléchargement :", erreur);

        res.status(500).json({
            message: "Erreur interne du serveur."
        });
    }
});

module.exports = router;
