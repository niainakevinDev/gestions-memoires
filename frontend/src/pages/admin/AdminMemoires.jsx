import { useEffect, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

function AdminMemoires() {
  const [memoires, setMemoires] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let actif = true;
    async function charger() {
      try {
        const response = await fetch(`${API}/api/admin/memoires`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Impossible de charger les mémoires.");
        if (actif) setMemoires(data);
      } catch (error) {
        if (actif) setErreur(error.message);
      } finally {
        if (actif) setChargement(false);
      }
    }
    charger();
    return () => { actif = false; };
  }, []);

  return (
    <section>
      <div className="mb-7 border-b border-stone-300 pb-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Suivi académique</p>
        <h1 className="font-serif text-3xl text-campus-ink sm:text-4xl">Gestion des mémoires</h1>
        <p className="mt-2 text-stone-600">Vue d’ensemble des mémoires, des étudiants, des encadreurs et des versions déposées.</p>
      </div>
      {erreur && <p role="alert" className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">{erreur}</p>}
      {chargement ? <p>Chargement des mémoires…</p> : memoires.length === 0 ? (
        <div className="border border-stone-200 bg-white p-6">Aucun mémoire enregistré pour le moment.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {memoires.map((memoire) => (
            <article key={memoire.memoire_id} className="border border-stone-200 bg-white p-5 sm:p-6">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="font-serif text-xl text-campus-ink">{memoire.titre}</h2>
                <span className="shrink-0 border border-stone-200 px-3 py-1 text-sm text-stone-600">#{memoire.memoire_id}</span>
              </div>
              <p className="mb-4 whitespace-pre-wrap text-gray-600">{memoire.resume || "Aucun résumé fourni."}</p>
              <dl className="grid grid-cols-1 gap-3 border-t pt-4 text-sm sm:grid-cols-2">
                <div><dt className="font-semibold text-gray-500">Niveau</dt><dd>{memoire.niveau || "—"}</dd></div>
                <div><dt className="font-semibold text-gray-500">Formation</dt><dd>{memoire.formation || "—"}</dd></div>
                <div><dt className="font-semibold text-gray-500">Année universitaire</dt><dd>{memoire.annee_universitaire || "—"}</dd></div>
                <div><dt className="font-semibold text-gray-500">Versions déposées</dt><dd>{memoire.nombre_versions ?? 0}</dd></div>
                <div className="sm:col-span-2"><dt className="font-semibold text-gray-500">Étudiant(s)</dt><dd>{memoire.etudiants || "Aucun étudiant associé"}</dd></div>
                <div className="sm:col-span-2"><dt className="font-semibold text-gray-500">Encadreur(s)</dt><dd>{memoire.encadreurs || "Aucun encadreur affecté"}</dd></div>
                <div className="sm:col-span-2"><dt className="font-semibold text-gray-500">Soutenance</dt><dd>{memoire.date_soutenance ? new Date(memoire.date_soutenance).toLocaleString("fr-FR") : "Non planifiée"}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminMemoires;
