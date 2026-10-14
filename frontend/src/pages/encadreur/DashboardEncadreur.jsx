import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SoutenancesMes from "../../components/SoutenancesMes";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

function DashboardEncadreur() {
const navigate = useNavigate();
const [memoires, setMemoires] = useState([]);
const [chargement, setChargement] = useState(true);
const [erreur, setErreur] = useState("");


const [memoireSelectionne, setMemoireSelectionne] = useState(null);
const [versions, setVersions] = useState([]);
const [chargementVersions, setChargementVersions] = useState(false);
const [erreurVersions, setErreurVersions] = useState("");

const [commentaires, setCommentaires] = useState({});
const [nouveauxCommentaires, setNouveauxCommentaires] = useState({});
const [enregistrement, setEnregistrement] = useState(null);
const [message, setMessage] = useState("");

const statutsDisponibles = [
    { valeur: "SOUMISE", libelle: "Soumise" },
    { valeur: "EN_REVISION", libelle: "En cours de correction" },
    { valeur: "VALIDEE", libelle: "Validée" },
    { valeur: "REJETEE", libelle: "Refusée" }
];



const token = localStorage.getItem("token");

useEffect(() => {
    const chargerMemoires = async () => {
        try {
            const response = await fetch(
                `${API}/api/encadreur/memoires`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Impossible de charger les mémoires."
                );
            }

            setMemoires(data);
        } catch (error) {
            console.error(error);
            setErreur(error.message);
        } finally {
            setChargement(false);
        }
    };

    chargerMemoires();
}, [token]);

async function consulterVersions(memoire) {
    setMemoireSelectionne(memoire);
    setVersions([]);
    setErreurVersions("");
    setMessage("");
    setChargementVersions(true);

    try {
        const response = await fetch(
            `${API}/api/versions/memoire/${memoire.memoire_id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Impossible de charger les versions."
            );
        }

        setVersions(data);

        // Charger les commentaires de chaque version
        for (const version of data) {
            await chargerCommentaires(version.version_id);
        }
    } catch (error) {
        console.error(error);
        setErreurVersions(error.message);
    } finally {
        setChargementVersions(false);
    }
}

async function chargerCommentaires(versionId) {
    try {
        const response = await fetch(
            `${API}/api/commentaires/${versionId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Impossible de charger les commentaires."
            );
        }

        setCommentaires((anciens) => ({
            ...anciens,
            [versionId]: data,
        }));
    } catch (error) {
        console.error(error);
    }
}

async function telechargerPDF(versionId, numeroVersion) {
    try {
        const response = await fetch(
            `${API}/api/versions/${versionId}/fichier`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const data = await response.json();
            throw new Error(
                data.message || "Impossible de télécharger le PDF."
            );
        }

        const fichier = await response.blob();
        const url = window.URL.createObjectURL(fichier);
        const lien = document.createElement("a");

        lien.href = url;
        lien.download = `memoire-version-${numeroVersion}.pdf`;

        document.body.appendChild(lien);
        lien.click();
        lien.remove();

        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
        setMessage(error.message);
    }
}

async function ajouterCommentaire(versionId) {
    const contenu = nouveauxCommentaires[versionId]?.trim();

    if (!contenu) {
        setMessage("Veuillez saisir un commentaire.");
        return;
    }

    setEnregistrement(versionId);
    setMessage("");

    try {
        const response = await fetch(
            `${API}/api/commentaires`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    versionId,
                    contenu,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Impossible d'enregistrer le commentaire."
            );
        }

        setNouveauxCommentaires((anciens) => ({
            ...anciens,
            [versionId]: "",
        }));

        await chargerCommentaires(versionId);

        setMessage("Commentaire enregistré avec succès.");
    } catch (error) {
        console.error(error);
        setMessage(error.message);
    } finally {
        setEnregistrement(null);
    }
}

if (chargement) {
    return <p className="mx-auto max-w-6xl p-6 text-stone-600">Chargement des mémoires...</p>;
}

async function modifierStatut(versionId, nouveauStatut) {
    setMessage("");
    setEnregistrement(versionId);

    try {
        const response = await fetch(
            `${API}/api/versions/${versionId}/statut`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    statut: nouveauStatut
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Impossible de modifier le statut."
            );
        }

        // Mettre à jour le statut dans l'interface
        setVersions(anciennesVersions =>
            anciennesVersions.map(version =>
                version.version_id === versionId
                    ? {
                        ...version,
                        version_statut: nouveauStatut
                    }
                    : version
            )
        );

        setMessage("Statut modifié avec succès.");

    } catch (error) {
        console.error(error);
        setMessage(error.message);
    } finally {
        setEnregistrement(null);
    }
}


if (erreur) {
    return (
        <div className="m-6 border-l-4 border-red-700 bg-red-50 p-4 text-red-800">
            {erreur}
        </div>
    );
}

return (
    <main className="mx-auto min-h-screen w-[min(100%_-_2rem,_72rem)] py-6 sm:py-9">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-stone-300 bg-white px-5 py-4">
            <Link className="flex items-center gap-3 text-campus-ink no-underline" to="/encadreur">
                <img className="h-10 w-10 rounded-full object-cover" src="/images/LogoApp1.jpg" alt="" />
                <span className="font-serif text-base font-semibold">Espace encadreur</span>
            </Link>
            <button
                type="button"
                onClick={() => {
                    localStorage.removeItem("token");
                    navigate("/login", { replace: true });
                }}
                className="rounded-sm border border-stone-300 px-4 py-2 text-sm font-semibold text-campus-ink hover:bg-campus-paper"
            >
                Déconnexion
            </button>
        </header>
        <div className="mb-8 border-b border-stone-300 pb-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Espace pédagogique</p>
            <h1 className="font-serif text-3xl text-campus-ink sm:text-4xl">Suivi des mémoires</h1>
            <p className="mt-2 max-w-2xl leading-7 text-stone-600">Consultez les dépôts, échangez avec les étudiants et suivez l’avancement des travaux.</p>
        </div>
        <SoutenancesMes />

        {message && (
            <div className="mb-4 border-l-4 border-campus-green bg-emerald-50 p-3 text-campus-green">
                {message}
            </div>
        )}

        {memoires.length === 0 ? (
            <div className="border border-stone-200 bg-white p-6">
                Aucun mémoire ne vous a encore été affecté.
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {memoires.map((memoire) => (
                    <article
                        key={memoire.memoire_id}
                        className="border border-stone-200 bg-white p-6 transition hover:shadow-md"
                    >
                        <h2 className="mb-3 font-serif text-xl text-campus-ink">
                            {memoire.memoire_titre}
                        </h2>

                        <p className="mb-4 text-gray-600">
                            {memoire.memoire_resume ||
                                "Aucun résumé disponible."}
                        </p>

                        <div className="space-y-2 border-t pt-4 text-sm">
                            <p>
                                <strong>Niveau :</strong>{" "}
                                {memoire.memoire_niveau}
                            </p>

                            <p>
                                <strong>Formation :</strong>{" "}
                                {memoire.memoire_formation}
                            </p>

                            <p>
                                <strong>Année universitaire :</strong>{" "}
                                {memoire.annee_universitaire}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => consulterVersions(memoire)}
                            className="mt-5 w-full rounded-sm bg-campus-green px-4 py-3 font-medium text-white hover:bg-[#244a38]"
                        >
                            Consulter les versions
                        </button>
                    </article>
                ))}
            </div>
        )}

        {memoireSelectionne && (
            <section className="mt-10 border border-stone-200 bg-white p-5 sm:p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            Historique des versions
                        </h2>

                        <p className="mt-1 text-gray-600">
                            {memoireSelectionne.memoire_titre}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setMemoireSelectionne(null);
                            setVersions([]);
                            setErreurVersions("");
                        }}
                        className="rounded-lg border px-4 py-2 hover:bg-gray-100"
                    >
                        Fermer
                    </button>
                </div>

                {chargementVersions ? (
                    <p>Chargement des versions...</p>
                ) : erreurVersions ? (
                    <p className="rounded-lg bg-red-100 p-3 text-red-700">
                        {erreurVersions}
                    </p>
                ) : versions.length === 0 ? (
                    <p className="rounded-lg bg-gray-100 p-4 text-gray-600">
                        Aucune version n'a encore été déposée pour ce
                        mémoire.
                    </p>
                ) : (
                    <div className="space-y-6">
                        {versions.map((version) => (
                            <article
                                key={version.version_id}
                                className="rounded-lg border p-5"
                            >
                                
<div className="flex flex-wrap items-center justify-between gap-3">
    <h3 className="text-lg font-bold text-slate-800">
        Version {version.numero_version}
    </h3>

    <span className="bg-stone-100 px-3 py-1 text-sm text-stone-700">
        {statutsDisponibles.find(
            statut => statut.valeur === version.version_statut
        )?.libelle || version.version_statut}
    </span>
</div>

<div className="mt-4">
    <label
        htmlFor={`statut-${version.version_id}`}
        className="mb-2 block font-medium text-gray-700"
    >
        Modifier le statut
    </label>

    <select
        id={`statut-${version.version_id}`}
        value={version.version_statut}
        onChange={e =>
            modifierStatut(version.version_id, e.target.value)
        }
        disabled={enregistrement === version.version_id}
        className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    >
        {statutsDisponibles.map(statut => (
            <option key={statut.valeur} value={statut.valeur}>
                {statut.libelle}
            </option>
        ))}
    </select>

    {enregistrement === version.version_id && (
        <p className="mt-2 text-sm text-campus-green">
            Enregistrement du statut...
        </p>
    )}
</div>



                                <p className="mt-2 text-sm text-gray-500">
                                    Déposée le :{" "}
                                    {version.created_at
                                        ? new Date(
                                              version.created_at
                                          ).toLocaleString("fr-FR")
                                        : "Date indisponible"}
                                </p>

                                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                                    <p className="mb-1 font-semibold">
                                        Commentaire de l'étudiant
                                    </p>

                                    <p className="whitespace-pre-wrap text-gray-700">
                                        {version.commentaire_etudiant ||
                                            "Aucun commentaire fourni."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        telechargerPDF(
                                            version.version_id,
                                            version.numero_version
                                        )
                                    }
                                    className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                                >
                                    Télécharger le PDF
                                </button>

                                <div className="mt-6 border-t pt-5">
                                    <h4 className="mb-3 font-bold text-slate-800">
                                        Commentaires de l'encadreur
                                    </h4>

                                    {!commentaires[version.version_id] ||
                                    commentaires[version.version_id]
                                        .length === 0 ? (
                                        <p className="mb-3 text-sm text-gray-500">
                                            Aucun commentaire enregistré.
                                        </p>
                                    ) : (
                                        <div className="mb-4 space-y-3">
                                            {commentaires[
                                                version.version_id
                                            ].map((commentaire) => (
                                                <div
                                                    key={
                                                        commentaire.commentaire_id
                                                    }
                                                    className="rounded-lg bg-gray-50 p-3"
                                                >
                                                    <p className="whitespace-pre-wrap text-gray-700">
                                                        {commentaire.contenu}
                                                    </p>

                                                    <p className="mt-2 text-xs text-gray-500">
                                                        {commentaire.encadreur_prenom}{" "}
                                                        {commentaire.encadreur_nom}
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
                                            ))}
                                        </div>
                                    )}

                                    <label className="mb-2 block font-medium">
                                        Ajouter un commentaire
                                    </label>

                                    <textarea
                                        value={
                                            nouveauxCommentaires[
                                                version.version_id
                                            ] || ""
                                        }
                                        onChange={(e) =>
                                            setNouveauxCommentaires(
                                                (anciens) => ({
                                                    ...anciens,
                                                    [version.version_id]:
                                                        e.target.value,
                                                })
                                            )
                                        }
                                        rows={3}
                                        maxLength={5000}
                                        placeholder="Saisissez vos remarques sur cette version..."
                                        className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            ajouterCommentaire(
                                                version.version_id
                                            )
                                        }
                                        disabled={
                                            enregistrement ===
                                            version.version_id
                                        }
                                        className="mt-3 rounded-sm bg-campus-green px-4 py-2 text-white hover:bg-[#244a38] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {enregistrement ===
                                        version.version_id
                                            ? "Enregistrement..."
                                            : "Enregistrer le commentaire"}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        )}
    </main>
);


}

export default DashboardEncadreur;
