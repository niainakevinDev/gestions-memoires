
const express = require("express");
const cors = require("cors");

const db = require("./config/database");

const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");
const etudiantRoutes = require("./routes/etudiantRoutes");
const memoireRoutes = require("./routes/memoireRoutes");
const versionMemoireRoutes = require("./routes/versionMemoireRoutes");
const commentaireRoutes = require("./routes/commentaireRoutes");
const adminRoutes = require("./routes/adminRoutes");
const encadreurRoutes = require("./routes/encadreurRoutes");
const soutenanceRoutes = require("./routes/soutenanceRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Test de la connexion MySQL
db.query("SELECT 1")
    .then(() => {
        console.log("Connexion à MySQL réussie !");
    })
    .catch((erreur) => {
        console.error("Erreur MySQL :", erreur);
    });

// Routes
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/etudiants", etudiantRoutes);
app.use("/api/versions", versionMemoireRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/memoires", memoireRoutes);
app.use("/api/commentaires", commentaireRoutes);
app.use("/api/encadreur", encadreurRoutes);
app.use("/api/soutenances", soutenanceRoutes);

// Démarrage du serveur
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

