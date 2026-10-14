const bcrypt = require("bcrypt");
const db = require("../config/database");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    let connexion;
    let transactionDemarree = false;

    try {
        const {
            nom,
            prenom,
            matricule,
            email,
            telephone = null,
            niveau = "",
            formation = "",
            motDePasse
        } = req.body || {};

        if (
            typeof nom !== "string" ||
            typeof prenom !== "string" ||
            typeof matricule !== "string" ||
            typeof email !== "string" ||
            typeof motDePasse !== "string" ||
            !nom.trim() || !prenom.trim() || !matricule.trim() ||
            !email.trim() || !motDePasse
        ) {
            return res.status(400).json({
                message: "Les champs nom, prénom, matricule, email et mot de passe sont obligatoires."
            });
        }

        const nomNettoye = nom.trim();
        const prenomNettoye = prenom.trim();
        const matriculeNettoye = matricule.trim();
        const emailNormalise = email.trim().toLowerCase();

        if (
            nomNettoye.length > 100 || prenomNettoye.length > 100 ||
            matriculeNettoye.length > 50 || emailNormalise.length > 254 ||
            (typeof telephone === "string" && telephone.length > 30) ||
            (typeof niveau !== "string") || (typeof formation !== "string")
        ) {
            return res.status(400).json({
                message: "Un ou plusieurs champs sont invalides ou trop longs."
            });
        }

        if (motDePasse.length < 8 || motDePasse.length > 72) {
            return res.status(400).json({
                message: "Le mot de passe doit contenir entre 8 et 72 caractères."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalise)) {
            return res.status(400).json({ message: "L'adresse email est invalide." });
        }

        connexion = await db.getConnection();
        await connexion.beginTransaction();
        transactionDemarree = true;

        const [users] = await connexion.query(
            "SELECT user_id FROM users WHERE user_email = ? FOR UPDATE",
            [emailNormalise]
        );
        if (users.length > 0) {
            await connexion.rollback();
            transactionDemarree = false;
            return res.status(409).json({ message: "Cet email est déjà utilisé." });
        }

        const [etudiants] = await connexion.query(
            "SELECT etudiant_id FROM etudiants WHERE etudiant_matricule = ?",
            [matriculeNettoye]
        );
        if (etudiants.length > 0) {
            await connexion.rollback();
            transactionDemarree = false;
            return res.status(409).json({ message: "Ce matricule est déjà utilisé." });
        }

        const hash = await bcrypt.hash(motDePasse, 10);
        const [resultatUser] = await connexion.query(
            "INSERT INTO users (user_email, user_mdp, user_role) VALUES (?, ?, 'ETUDIANT')",
            [emailNormalise, hash]
        );

        const [resultatEtudiant] = await connexion.query(
            `INSERT INTO etudiants
                (user_id, etudiant_matricule, etudiant_nom, etudiant_prenom,
                 etudiant_formation, etudiant_niveau, etudiant_telephone)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                resultatUser.insertId,
                matriculeNettoye,
                nomNettoye,
                prenomNettoye,
                formation.trim(),
                niveau.trim(),
                typeof telephone === "string" ? telephone.trim() || null : null
            ]
        );

        await connexion.commit();
        transactionDemarree = false;

        return res.status(201).json({
            message: "Inscription réussie.",
            etudiantId: resultatEtudiant.insertId
        });
    } catch (erreur) {
        if (connexion && transactionDemarree) {
            try { await connexion.rollback(); } catch (rollbackError) {
                console.error("Erreur d'annulation de transaction :", rollbackError);
            }
        }
        console.error("Erreur lors de l'inscription :", erreur);
        if (erreur.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Cet email ou ce matricule est déjà utilisé." });
        }
        return res.status(500).json({ message: "Erreur interne du serveur lors de l'inscription." });
    } finally {
        if (connexion) connexion.release();
    }
};

const login = async (req, res) => {
    try {
        const { email, motDePasse } = req.body || {};
        if (typeof email !== "string" || typeof motDePasse !== "string" || !email.trim() || !motDePasse) {
            return res.status(400).json({ message: "L'email et le mot de passe sont obligatoires." });
        }
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET n'est pas configuré.");
            return res.status(500).json({ message: "La configuration du serveur est incomplète." });
        }

        const emailNormalise = email.trim().toLowerCase();
        const [users] = await db.query(
            "SELECT user_id, user_email, user_mdp, user_role FROM users WHERE user_email = ?",
            [emailNormalise]
        );
        if (users.length === 0) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }

        const motDePasseCorrect = await bcrypt.compare(motDePasse, users[0].user_mdp);
        if (!motDePasseCorrect) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }

        const token = jwt.sign(
            { userId: users[0].user_id, role: users[0].user_role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        return res.json({ message: "Connexion réussie.", token });
    } catch (erreur) {
        console.error("Erreur lors de la connexion :", erreur);
        return res.status(500).json({ message: "Erreur interne du serveur." });
    }
};

module.exports = { register, login };
