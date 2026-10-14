import { useEffect, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

function AdminAffectations() {
  const [memoires, setMemoires] = useState([]);
  const [encadreurs, setEncadreurs] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [memoireSelectionne, setMemoireSelectionne] = useState("");
  const [encadreurSelectionne, setEncadreurSelectionne] = useState("");
  const [role, setRole] = useState("PRINCIPAL");
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
      const [listeMemoires, listeEncadreurs, listeAffectations] = await Promise.all([
        requete("/api/admin/memoires"),
        requete("/api/admin/encadreurs"),
        requete("/api/admin/affectations"),
      ]);
      setMemoires(listeMemoires);
      setEncadreurs(listeEncadreurs);
      setAffectations(listeAffectations);
    } catch (error) {
      setErreur(error.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerDonnees(); }, []);

  async function affecterEncadreur(event) {
    event.preventDefault();
    setErreur("");
    setMessage("");
    setEnregistrement(true);
    try {
      const data = await requete("/api/admin/affectations", {
        method: "POST",
        body: JSON.stringify({ memoireId: Number(memoireSelectionne), encadreurId: Number(encadreurSelectionne), role }),
      });
      setMessage(data.message || "Affectation créée.");
      setMemoireSelectionne("");
      setEncadreurSelectionne("");
      setRole("PRINCIPAL");
      await chargerDonnees();
    } catch (error) {
      setErreur(error.message);
    } finally {
      setEnregistrement(false);
    }
  }

  async function supprimerAffectation(affectation) {
    if (!window.confirm(`Retirer ${affectation.encadreur_prenom} ${affectation.encadreur_nom} du mémoire « ${affectation.titre} » ?`)) return;
    setErreur("");
    setMessage("");
    try {
      const data = await requete(`/api/admin/affectations/${affectation.memoire_id}/${affectation.encadreur_id}`, { method: "DELETE" });
      setMessage(data.message || "Affectation supprimée.");
      await chargerDonnees();
    } catch (error) {
      setErreur(error.message);
    }
  }

  return (
    <div>
      <div className="mb-7 border-b border-stone-300 pb-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Équipe pédagogique</p>
        <h1 className="font-serif text-3xl text-campus-ink sm:text-4xl">Affectations</h1>
        <p className="mt-2 text-stone-600">Associez les encadreurs aux mémoires et gérez les affectations existantes.</p>
      </div>
      {erreur && <p role="alert" className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{erreur}</p>}
      {message && <p role="status" className="mb-4 rounded-lg bg-green-100 p-3 text-green-800">{message}</p>}

      <form onSubmit={affecterEncadreur} className="mb-8 space-y-4 border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="font-serif text-xl">Affecter un encadreur</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-sm font-medium">Mémoire
            <select required value={memoireSelectionne} onChange={(e) => setMemoireSelectionne(e.target.value)} className="mt-2 min-h-11 w-full rounded-sm border border-stone-300 bg-white p-3">
              <option value="">Choisir un mémoire</option>
              {memoires.map((m) => <option key={m.memoire_id} value={m.memoire_id}>{m.titre}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Encadreur
            <select required value={encadreurSelectionne} onChange={(e) => setEncadreurSelectionne(e.target.value)} className="mt-2 min-h-11 w-full rounded-sm border border-stone-300 bg-white p-3">
              <option value="">Choisir un encadreur</option>
              {encadreurs.map((e) => <option key={e.encadreur_id} value={e.encadreur_id}>{e.encadreur_nom} {e.encadreur_prenom}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Rôle
            <select required value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 min-h-11 w-full rounded-sm border border-stone-300 bg-white p-3">
              <option value="PRINCIPAL">Encadreur principal</option><option value="CO_ENCADREUR">Co-encadreur</option>
            </select>
          </label>
        </div>
        <button disabled={enregistrement || chargement || !memoires.length || !encadreurs.length} className="rounded-sm bg-campus-green px-5 py-3 font-semibold text-white hover:bg-[#244a38] disabled:opacity-50">{enregistrement ? "Enregistrement…" : "Créer l'affectation"}</button>
      </form>

      <section className="border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-serif text-xl">Affectations actuelles</h2>
        {chargement ? <p>Chargement…</p> : affectations.length === 0 ? <p className="text-gray-600">Aucune affectation enregistrée.</p> : (
          <div className="space-y-3">
            {affectations.map((a) => (
              <article key={`${a.memoire_id}-${a.encadreur_id}`} className="flex flex-col justify-between gap-3 border-t border-stone-200 py-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-serif text-lg text-campus-ink">{a.titre}</h3>
                  <p className="text-sm text-gray-600">{a.encadreur_prenom} {a.encadreur_nom} · {a.encadreur_matricule}</p>
                  <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{a.memoire_role === "PRINCIPAL" ? "Encadreur principal" : "Co-encadreur"}</span>
                </div>
                <button onClick={() => supprimerAffectation(a)} className="rounded-sm border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50">Retirer</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminAffectations;
