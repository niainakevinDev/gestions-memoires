import { useEffect, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const FORMULAIRE_VIDE = { memoireId: "", date: "", lieu: "", jury: "", statut: "PLANIFIEE", commentaire: "" };
const LIBELLES_STATUT = { PLANIFIEE: "Planifiée", REALISEE: "Réalisée", ANNULEE: "Annulée" };

function AdminSoutenances() {
  const [memoires, setMemoires] = useState([]);
  const [soutenances, setSoutenances] = useState([]);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [editionId, setEditionId] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  async function requete(url, options = {}) {
    const response = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Une erreur est survenue.");
    return data;
  }

  async function chargerDonnees() {
    setErreur("");
    try {
      const [listeSoutenances, listeMemoires] = await Promise.all([
        requete("/api/soutenances"),
        requete("/api/admin/memoires"),
      ]);
      setSoutenances(listeSoutenances);
      setMemoires(listeMemoires);
    } catch (error) {
      setErreur(error.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerDonnees(); }, []);

  function modifierChamp(event) {
    const { name, value } = event.target;
    setFormulaire((ancien) => ({ ...ancien, [name]: value }));
  }

  function commencerEdition(soutenance) {
    setEditionId(soutenance.soutenance_id);
    setFormulaire({
      memoireId: String(soutenance.memoire_id),
      date: soutenance.date || "",
      lieu: soutenance.lieu || "",
      jury: soutenance.jury || "",
      statut: soutenance.statut || "PLANIFIEE",
      commentaire: soutenance.commentaire || "",
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function annulerEdition() {
    setEditionId(null);
    setFormulaire(FORMULAIRE_VIDE);
  }

  async function enregistrer(event) {
    event.preventDefault();
    setErreur("");
    setMessage("");
    setEnregistrement(true);
    try {
      const payload = {
        ...formulaire,
        memoireId: Number(formulaire.memoireId),
      };
      const url = editionId ? `/api/soutenances/${editionId}` : "/api/soutenances";
      await requete(url, {
        method: editionId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setMessage(editionId ? "Soutenance mise à jour." : "Soutenance planifiée.");
      annulerEdition();
      await chargerDonnees();
    } catch (error) {
      setErreur(error.message);
    } finally {
      setEnregistrement(false);
    }
  }

  async function supprimer(soutenance) {
    if (!window.confirm(`Supprimer la soutenance de « ${soutenance.titre} » ?`)) return;
    setErreur("");
    setMessage("");
    try {
      await requete(`/api/soutenances/${soutenance.soutenance_id}`, { method: "DELETE" });
      setMessage("Soutenance supprimée.");
      if (editionId === soutenance.soutenance_id) annulerEdition();
      await chargerDonnees();
    } catch (error) {
      setErreur(error.message);
    }
  }

  return (
    <section>
      <div className="mb-7 border-b border-stone-300 pb-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Calendrier académique</p>
        <h1 className="font-serif text-3xl text-campus-ink sm:text-4xl">Gestion des soutenances</h1>
        <p className="mt-2 text-stone-600">Planifiez les dates, indiquez le lieu et le jury, puis mettez à jour le statut de chaque soutenance.</p>
      </div>
      {erreur && <p role="alert" className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{erreur}</p>}
      {message && <p role="status" className="mb-4 rounded-lg bg-green-100 p-3 text-green-800">{message}</p>}

      <form onSubmit={enregistrer} className="mb-8 space-y-4 border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="font-serif text-xl">{editionId ? "Modifier une soutenance" : "Planifier une soutenance"}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">Mémoire
            <select name="memoireId" value={formulaire.memoireId} onChange={modifierChamp} required className="mt-1 w-full rounded-lg border p-3">
              <option value="">Choisir un mémoire</option>
              {memoires.map((m) => <option key={m.memoire_id} value={m.memoire_id}>{m.titre}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">Date et heure
            <input name="date" type="datetime-local" value={formulaire.date} onChange={modifierChamp} required className="mt-1 w-full rounded-lg border p-3" />
          </label>
          <label className="block text-sm font-medium text-gray-700">Lieu
            <input name="lieu" value={formulaire.lieu} onChange={modifierChamp} maxLength={255} required placeholder="Ex. : Salle de soutenance 2" className="mt-1 w-full rounded-lg border p-3" />
          </label>
          <label className="block text-sm font-medium text-gray-700">Statut
            <select name="statut" value={formulaire.statut} onChange={modifierChamp} className="mt-1 w-full rounded-lg border p-3">
              <option value="PLANIFIEE">Planifiée</option><option value="REALISEE">Réalisée</option><option value="ANNULEE">Annulée</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700 md:col-span-2">Membres du jury
            <textarea name="jury" value={formulaire.jury} onChange={modifierChamp} maxLength={5000} rows={2} placeholder="Noms des membres du jury" className="mt-1 w-full rounded-lg border p-3" />
          </label>
          <label className="block text-sm font-medium text-gray-700 md:col-span-2">Informations complémentaires
            <textarea name="commentaire" value={formulaire.commentaire} onChange={modifierChamp} maxLength={5000} rows={2} placeholder="Consignes ou remarques (facultatif)" className="mt-1 w-full rounded-lg border p-3" />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button disabled={enregistrement || memoires.length === 0} className="rounded-sm bg-campus-green px-5 py-3 font-semibold text-white hover:bg-[#244a38] disabled:opacity-50">
            {enregistrement ? "Enregistrement…" : editionId ? "Enregistrer les modifications" : "Planifier la soutenance"}
          </button>
          {editionId && <button type="button" onClick={annulerEdition} className="rounded-sm border border-stone-300 px-5 py-3 hover:bg-campus-paper">Annuler</button>}
        </div>
        {memoires.length === 0 && !chargement && <p className="text-sm text-amber-700">Il faut d'abord enregistrer un mémoire pour planifier une soutenance.</p>}
      </form>

      <div className="border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-serif text-xl">Soutenances enregistrées</h2>
        {chargement ? <p>Chargement…</p> : soutenances.length === 0 ? <p className="text-gray-600">Aucune soutenance n'est planifiée.</p> : (
          <div className="space-y-4">
            {soutenances.map((s) => (
              <article key={s.soutenance_id} className="border-t border-stone-200 py-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <h3 className="font-serif text-lg text-campus-ink">{s.titre}</h3>
                    <p className="mt-1 text-sm text-gray-600">{s.date ? new Date(`${s.date}:00`).toLocaleString("fr-FR") : "Date non définie"} · {s.lieu}</p>
                    <p className="mt-1 text-sm text-gray-600">Étudiant(s) : {s.etudiants || "Non renseigné"}</p>
                    <p className="mt-2"><span className="bg-emerald-50 px-3 py-1 text-sm text-campus-green">{LIBELLES_STATUT[s.statut] || s.statut}</span></p>
                    {s.jury && <p className="mt-3 whitespace-pre-wrap text-sm"><strong>Jury :</strong> {s.jury}</p>}
                    {s.commentaire && <p className="mt-2 whitespace-pre-wrap text-sm"><strong>Informations :</strong> {s.commentaire}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <button onClick={() => commencerEdition(s)} className="rounded-sm border border-stone-300 px-4 py-2 text-sm font-semibold text-campus-ink hover:bg-campus-paper">Modifier</button>
                    <button onClick={() => supprimer(s)} className="rounded-sm border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50">Supprimer</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminSoutenances;
