
import { useEffect, useState } from "react";
import NavBar from "../components/Navbar";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

// Déterminer le libellé et la couleur du statut
const obtenirStyleStatut = (statut) => {
    switch (statut) {
        case "SOUMISE":
            return {
                libelle: "Soumise",
                couleur: "bg-stone-100 text-stone-700"
            };

        case "EN_REVISION":
            return {
                libelle: "En cours de révision",
                couleur: "bg-amber-100 text-amber-800"
            };

        case "VALIDEE":
            return {
                libelle: "Validée",
                couleur: "bg-green-100 text-green-800"
            };

        case "REJETEE":
            return {
                libelle: "Refusée",
                couleur: "bg-red-100 text-red-800"
            };

        default:
            return {
                libelle: statut || "Inconnu",
                couleur: "bg-gray-100 text-gray-800"
            };
    }
};

function Memoire() {
    const [memoires, setMemoires] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [enModification, setEnModification] = useState(false);
    const [commentairesEncadreur, setCommentairesEncadreur] = useState({});

    const [formulaire, setFormulaire] = useState({
        titre: "",
        resume: "",
        niveau: "",
        formation: "",
        anneeUniversitaire: ""
    });

    // États pour la soumission des versions
    const [versions, setVersions] = useState([]);
    const [chargementVersions, setChargementVersions] = useState(false);
    const [fichier, setFichier] = useState(null);
    const [commentaireVersion, setCommentaireVersion] = useState("");
    const [envoiVersion, setEnvoiVersion] = useState(false);

    const token = localStorage.getItem("token");
    
// Calculer les statistiques des versions du mémoire
const statistiques = {
    total: versions.length,

    enRevision: versions.filter(
        (version) => version.version_statut === "EN_REVISION"
    ).length,

    validees: versions.filter(
        (version) => version.version_statut === "VALIDEE"
    ).length,

    refusees: versions.filter(
        (version) => version.version_statut === "REJETEE"
    ).length
};



    // Charger les mémoires de l'étudiant
    const chargerMemoires = async () => {
        try {
            const response = await fetch(
                `${API}/api/memoires`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Impossible de charger les mémoires.");
                return;
            }

            setMemoires(data);

            // Charger l'historique du mémoire de l'étudiant
            if (data.length > 0) {
                await chargerVersions(data[0].memoire_id);
            } else {
                setVersions([]);
            }
        } catch (error) {
            console.error("Erreur de chargement des mémoires :", error);
        } finally {
            setChargement(false);
        }
    };

    // Charger les versions d'un mémoire
    const chargerVersions = async (memoireId) => {
        setChargementVersions(true);

        try {
            const response = await fetch(
                `${API}/api/versions/memoire/${memoireId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    "Erreur de récupération des versions :",
                    data.message
                );
                return;
            }

            setVersions(data);

            // Charger les commentaires de chaque version
            await Promise.all(
                data.map((version) =>
                    chargerCommentairesEncadreur(version.version_id)
                )
            );
        } catch (error) {
            console.error("Erreur de chargement des versions :", error);
        } finally {
            setChargementVersions(false);
        }
    };

    // Charger les commentaires de l'encadreur pour une version
    const chargerCommentairesEncadreur = async (versionId) => {
        try {
            const response = await fetch(
                `${API}/api/commentaires/${versionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Impossible de charger les commentaires."
                );
            }

            setCommentairesEncadreur((anciens) => ({
                ...anciens,
                [versionId]: data
            }));
        } catch (error) {
            console.error(
                "Erreur de chargement des commentaires :",
                error
            );
        }
    };

    useEffect(() => {
        chargerMemoires();
    }, []);

    // Modifier un champ du formulaire du mémoire
    const handleChange = (e) => {
        setFormulaire({
            ...formulaire,
            [e.target.name]: e.target.value
        });
    };

    // Préparer la modification du mémoire
    const commencerModification = (memoire) => {
        setFormulaire({
            titre: memoire.memoire_titre || "",
            resume: memoire.memoire_resume || "",
            niveau: memoire.memoire_niveau || "",
            formation: memoire.memoire_formation || "",
            anneeUniversitaire: memoire.annee_universitaire || ""
        });

        setEnModification(true);
    };

    // Créer ou modifier le mémoire
    const enregistrerMemoire = async (e) => {
        e.preventDefault();

        if (
            !formulaire.titre.trim() ||
            !formulaire.niveau ||
            !formulaire.formation.trim() ||
            !formulaire.anneeUniversitaire.trim()
        ) {
            alert("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        try {
            const memoireExistant = memoires[0];

            const url = enModification
                ? `${API}/api/memoires/${memoireExistant.memoire_id}`
                : `${API}/api/memoires`;

            const response = await fetch(url, {
                method: enModification ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formulaire)
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Une erreur est survenue.");
                return;
            }

            alert(data.message);

            setEnModification(false);

            setFormulaire({
                titre: "",
                resume: "",
                niveau: "",
                formation: "",
                anneeUniversitaire: ""
            });

            await chargerMemoires();
        } catch (error) {
            console.error("Erreur d'enregistrement :", error);
            alert("Impossible de contacter le serveur.");
        }
    };

    // Annuler la modification
    const annulerModification = () => {
        setEnModification(false);

        setFormulaire({
            titre: "",
            resume: "",
            niveau: "",
            formation: "",
            anneeUniversitaire: ""
        });
    };

    // Soumettre une nouvelle version PDF
    const soumettreVersion = async (e, memoireId) => {
        e.preventDefault();

        if (!fichier) {
            alert("Veuillez sélectionner un fichier PDF.");
            return;
        }

        if (
            fichier.type !== "application/pdf" ||
            !fichier.name.toLowerCase().endsWith(".pdf")
        ) {
            alert("Seuls les fichiers PDF sont autorisés.");
            return;
        }

        if (fichier.size > 10 * 1024 * 1024) {
            alert("Le fichier ne doit pas dépasser 10 Mo.");
            return;
        }

        const donnees = new FormData();

        donnees.append("memoireId", memoireId);
        donnees.append("commentaireEtudiant", commentaireVersion);
        donnees.append("fichier", fichier);

        setEnvoiVersion(true);

        try {
            const response = await fetch(
                `${API}/api/versions`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: donnees
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Impossible de soumettre la version.");
                return;
            }

            alert(
                `${data.message} Numéro de version : ${data.numeroVersion}`
            );

            setFichier(null);
            setCommentaireVersion("");

            // Réinitialiser le champ fichier du formulaire
            e.target.reset();

            // Actualiser l'historique des versions
            await chargerVersions(memoireId);
        } catch (error) {
            console.error("Erreur lors de la soumission :", error);
            alert("Impossible de contacter le serveur.");
        } finally {
            setEnvoiVersion(false);
        }
    };

    // Télécharger une version en passant par la route sécurisée
    const telechargerVersion = async (version) => {
        try {
            const response = await fetch(
                `${API}/api/versions/${version.version_id}/fichier`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                let message = "Impossible de télécharger le fichier.";

                try {
                    const data = await response.json();
                    message = data.message || message;
                } catch {
                    // La réponse n'est pas nécessairement du JSON.
                }

                alert(message);
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const lien = document.createElement("a");

            lien.href = url;
            lien.download = `version_${version.numero_version}.pdf`;

            document.body.appendChild(lien);
            lien.click();
            lien.remove();

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erreur de téléchargement :", error);
            alert("Impossible de contacter le serveur.");
        }
    };

    // Formulaire de création ou de modification du mémoire
    const afficherFormulaire = () => (
        <div className="border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="text-xl font-bold mb-6">
                {enModification
                    ? "Modifier mon mémoire"
                    : "Créer mon mémoire"}
            </h2>

            <form onSubmit={enregistrerMemoire} className="space-y-4">
                <div>
                    <label className="block mb-2 font-medium">
                        Titre *
                    </label>

                    <input
                        type="text"
                        name="titre"
                        value={formulaire.titre}
                        onChange={handleChange}
                        required
                        className="border p-3 rounded-lg w-full"
                    />
                </div>

                <div>
                    <label className="block mb-2 font-medium">
                        Résumé
                    </label>

                    <textarea
                        name="resume"
                        value={formulaire.resume}
                        onChange={handleChange}
                        className="border p-3 rounded-lg w-full min-h-32"
                    />
                </div>

                <div>
                    <label className="block mb-2 font-medium">
                        Niveau *
                    </label>

                    <select
                        name="niveau"
                        value={formulaire.niveau}
                        onChange={handleChange}
                        required
                        className="border p-3 rounded-lg w-full"
                    >
                        <option value="">Choisir le niveau</option>
                        <option value="L2">L2</option>
                        <option value="L3">L3</option>
                        <option value="M1">M1</option>
                        <option value="M2">M2</option>
                    </select>
                </div>

                <div>
                    <label className="block mb-2 font-medium">
                        Formation *
                    </label>

                    <input
                        type="text"
                        name="formation"
                        value={formulaire.formation}
                        onChange={handleChange}
                        required
                        className="border p-3 rounded-lg w-full"
                    />
                </div>

                <div>
                    <label className="block mb-2 font-medium">
                        Année universitaire *
                    </label>

                    <input
                        type="text"
                        name="anneeUniversitaire"
                        placeholder="Ex. : 2026-2027"
                        value={formulaire.anneeUniversitaire}
                        onChange={handleChange}
                        required
                        className="border p-3 rounded-lg w-full"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        className="rounded-sm bg-campus-green px-5 py-3 font-semibold text-white hover:bg-[#244a38]"
                    >
                        {enModification
                            ? "Enregistrer les modifications"
                            : "Créer le mémoire"}
                    </button>

                    {enModification && (
                        <button
                            type="button"
                            onClick={annulerModification}
                            className="rounded-sm border border-stone-300 px-5 py-3 text-campus-ink hover:bg-campus-paper"
                        >
                            Annuler
                        </button>
                    )}
                </div>
            </form>
        </div>
    );

    if (chargement) {
        return <p className="p-6">Chargement du mémoire...</p>;
    }

    return (
        <>
            <NavBar />
            <main className="mx-auto w-[min(100%_-_2rem,_72rem)] space-y-7 py-8 sm:py-10">
            <div className="border-b border-stone-300 pb-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Espace étudiant</p>
                <h1 className="font-serif text-3xl text-campus-ink sm:text-4xl">Mon mémoire</h1>
                <p className="mt-2 text-stone-600">Gérez votre mémoire universitaire, partagez vos versions et suivez les retours de votre encadreur.</p>
            </div>

            {memoires.length > 0 && (
                <section aria-label="Résumé des versions" className="grid grid-cols-2 gap-px border border-stone-200 bg-stone-200 sm:grid-cols-4">
                    {[
                        ["Versions déposées", statistiques.total],
                        ["En révision", statistiques.enRevision],
                        ["Validées", statistiques.validees],
                        ["À reprendre", statistiques.refusees],
                    ].map(([libelle, valeur]) => (
                        <div key={libelle} className="bg-white p-4 sm:p-5">
                            <p className="text-xs font-semibold text-stone-600 sm:text-sm">{libelle}</p>
                            <p className="mt-2 font-serif text-3xl text-campus-ink">{valeur}</p>
                        </div>
                    ))}
                </section>
            )}

            {memoires.length === 0 ? (
                afficherFormulaire()
            ) : (
                memoires.map((memoire) => (
                    <div
                        key={memoire.memoire_id}
                        className="space-y-8"
                    >
                        {/* Informations du mémoire */}
                        <div className="border border-stone-200 bg-white p-5 sm:p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <h2 className="font-serif text-2xl text-campus-ink">
                                        {memoire.memoire_titre}
                                    </h2>

                                    <p className="text-gray-600 mt-3 whitespace-pre-wrap">
                                        {memoire.memoire_resume ||
                                            "Aucun résumé renseigné."}
                                    </p>
                                </div>

                                {!enModification && (
                                    <button
                                        onClick={() =>
                                            commencerModification(memoire)
                                        }
                                        className="rounded-sm border border-stone-300 px-4 py-2 text-sm font-semibold text-campus-ink hover:bg-campus-paper"
                                    >
                                        Modifier
                                    </button>
                                )}
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2 xl:grid-cols-4">
                                <div>
                                    <p className="text-gray-500 text-sm">
                                        Niveau
                                    </p>

                                    <p className="font-medium">
                                        {memoire.memoire_niveau}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-sm">
                                        Formation
                                    </p>

                                    <p className="font-medium">
                                        {memoire.memoire_formation}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-sm">
                                        Année universitaire
                                    </p>

                                    <p className="font-medium">
                                        {memoire.annee_universitaire}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-sm">
                                        Encadreur(s)
                                    </p>

                                    <p className="font-medium">
                                        {memoire.encadreurs || "Aucun encadreur affecté"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Formulaire de modification */}
                        {enModification && afficherFormulaire()}

                        {/* Soumission d'une version PDF */}
                        <div className="border border-stone-200 bg-white p-5 sm:p-6">
                            <h2 className="mb-4 font-serif text-xl">
                                Soumettre une version
                            </h2>

                            <p className="text-gray-600 mb-5">
                                Sélectionnez le PDF de votre mémoire. La
                                taille maximale autorisée est de 10 Mo.
                            </p>

                            <form
                                onSubmit={(e) =>
                                    soumettreVersion(e, memoire.memoire_id)
                                }
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block mb-2 font-medium">
                                        Fichier PDF *
                                    </label>

                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        required
                                        onChange={(e) =>
                                            setFichier(
                                                e.target.files?.[0] || null
                                            )
                                        }
                                        className="border p-3 rounded-lg w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2 font-medium">
                                        Commentaire pour l'encadreur
                                    </label>

                                    <textarea
                                        value={commentaireVersion}
                                        onChange={(e) =>
                                            setCommentaireVersion(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Ex. : Première version du chapitre 1..."
                                        className="border p-3 rounded-lg w-full min-h-24"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={envoiVersion}
                                    className="rounded-sm bg-campus-green px-5 py-3 font-semibold text-white hover:bg-[#244a38] disabled:opacity-50"
                                >
                                    {envoiVersion
                                        ? "Envoi en cours..."
                                        : "Soumettre le PDF"}
                                </button>
                            </form>
                        </div>

                        {/* Historique des versions */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h2 className="text-xl font-bold mb-4">
                                Historique des versions
                            </h2>

                            {chargementVersions ? (
                                <p className="text-gray-500">
                                    Chargement des versions...
                                </p>
                            ) : versions.length === 0 ? (
                                <p className="text-gray-500">
                                    Aucune version soumise pour le moment.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {versions.map((version) => {
                                        const styleStatut = obtenirStyleStatut(
                                            version.version_statut
                                        );

                                        return (
                                            <div
                                                key={version.version_id}
                                                className="border rounded-lg p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                                            >
                                                <div className="flex-1">
                                                    <h3 className="font-semibold">
                                                        Version{" "}
                                                        {version.numero_version}
                                                    </h3>

                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Date :{" "}
                                                        {version.created_at
                                                            ? new Date(
                                                                  version.created_at
                                                              ).toLocaleString(
                                                                  "fr-FR"
                                                              )
                                                            : "Non disponible"}
                                                    </p>

                                                    {/* Statut coloré */}
                                                    <div className="mt-3">
                                                        <span className="mr-2 text-sm font-medium text-gray-600">
                                                            Statut :
                                                        </span>

                                                        <span
                                                            className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${styleStatut.couleur}`}
                                                        >
                                                            {styleStatut.libelle}
                                                        </span>
                                                    </div>

                                                    {/* Commentaire de l'étudiant */}
                                                    {version.commentaire_etudiant && (
                                                        <p className="mt-3">
                                                            <span className="font-medium">
                                                                Commentaire :
                                                            </span>{" "}
                                                            {version.commentaire_etudiant}
                                                        </p>
                                                    )}

                                                    {/* Commentaires de l'encadreur */}
                                                    <div className="mt-4 border-l-4 border-campus-green bg-emerald-50 p-4">
                                                        <h4 className="mb-3 font-semibold text-campus-green">
                                                            Commentaires de l'encadreur
                                                        </h4>

                                                        {!commentairesEncadreur[
                                                            version.version_id
                                                        ] ||
                                                        commentairesEncadreur[
                                                            version.version_id
                                                        ].length === 0 ? (
                                                            <p className="text-sm text-gray-600">
                                                                Aucun commentaire
                                                                pour cette version.
                                                            </p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {commentairesEncadreur[
                                                                    version.version_id
                                                                ].map(
                                                                    (commentaire) => (
                                                                        <div
                                                                            key={
                                                                                commentaire.commentaire_id
                                                                            }
                                                                            className="rounded-lg bg-white p-3"
                                                                        >
                                                                            <p className="whitespace-pre-wrap text-gray-700">
                                                                                {
                                                                                    commentaire.contenu
                                                                                }
                                                                            </p>

                                                                            <p className="mt-2 text-xs text-gray-500">
                                                                                {
                                                                                    commentaire.encadreur_prenom
                                                                                }{" "}
                                                                                {
                                                                                    commentaire.encadreur_nom
                                                                                }
                                                                                {" — "}
                                                                                {commentaire.created_at
                                                                                    ? new Date(
                                                                                          commentaire.created_at
                                                                                      ).toLocaleString(
                                                                                          "fr-FR"
                                                                                      )
                                                                                    : ""}
                                                                            </p>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        telechargerVersion(version)
                                                    }
                                                    className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 self-start"
                                                >
                                                    Télécharger le PDF
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
            </main>
        </>
    );
}

export default Memoire;
