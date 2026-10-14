import { useEffect, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const STATUTS = { PLANIFIEE: "Planifiée", REALISEE: "Réalisée", ANNULEE: "Annulée" };

function formaterDate(date) {
  if (!date) return "Non définie";
  const valeur = new Date(date);
  return Number.isNaN(valeur.getTime())
    ? "Non définie"
    : valeur.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

export default function SoutenancesMes({ standalone = false }) {
  const [soutenances, setSoutenances] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let actif = true;
    fetch(`${API}/api/soutenances/mes`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then(async (response) => {
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data.message || "Impossible de charger les soutenances.");
      if (actif) setSoutenances(data);
    }).catch((error) => {
      if (actif) setErreur(error.message || "Une erreur est survenue.");
    }).finally(() => {
      if (actif) setChargement(false);
    });
    return () => { actif = false; };
  }, []);

  const conteneur = standalone ? "w-full" : "mx-auto my-8 max-w-5xl";
  if (erreur) return <div role="alert" className={`${conteneur} border-l-4 border-red-700 bg-red-50 p-4 text-red-800`}>{erreur}</div>;

  return (
    <section id={standalone ? undefined : "soutenances"} className={`${conteneur} border border-stone-200 bg-white p-5 sm:p-7`}>
      {!standalone && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Calendrier académique</p>}
      <h2 className="mb-4 font-serif text-2xl text-campus-ink">{standalone ? "Mes rendez-vous" : "Mes soutenances"}</h2>
      {chargement ? (
        <p role="status" className="text-sm text-stone-600">Chargement de vos soutenances…</p>
      ) : soutenances.length === 0 ? (
        <p className="text-gray-600">Aucune soutenance n'est planifiée pour le moment.</p>
      ) : (
        <div className="divide-y divide-stone-200">
          {soutenances.map((s) => (
            <article key={s.soutenance_id} className="py-5 first:pt-1 last:pb-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-campus-green">Mémoire</p>
                  <h3 className="font-serif text-xl text-campus-ink">{s.titre || "Mémoire sans titre"}</h3>
                </div>
                <span className={`rounded-sm px-3 py-1.5 text-xs font-semibold ${s.statut === "ANNULEE" ? "bg-red-50 text-red-800" : s.statut === "REALISEE" ? "bg-stone-100 text-stone-700" : "bg-emerald-50 text-campus-green"}`}>
                  {STATUTS[s.statut] || s.statut || "Statut non défini"}
                </span>
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Date et heure</dt>
                  <dd className="mt-1 text-sm text-stone-800">{formaterDate(s.date)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Lieu</dt>
                  <dd className="mt-1 text-sm text-stone-800">{s.lieu || "À confirmer"}</dd>
                </div>
                {s.jury && <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Jury</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-stone-800">{s.jury}</dd>
                </div>}
                {s.commentaire && <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Informations complémentaires</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-stone-800">{s.commentaire}</dd>
                </div>}
                {(s.note !== null && s.note !== undefined && s.note !== "") || s.mention ? <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Résultat</dt>
                  <dd className="mt-1 text-sm font-medium text-stone-800">
                    {s.note !== null && s.note !== undefined && s.note !== "" ? `Note : ${s.note}` : ""}
                    {s.note !== null && s.note !== undefined && s.note !== "" && s.mention ? " · " : ""}
                    {s.mention ? `Mention : ${s.mention}` : ""}
                  </dd>
                </div> : null}
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
