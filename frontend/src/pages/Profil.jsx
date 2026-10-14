import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/Navbar";
import graduationImage from "../assets/campus-study.jpg";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const CHAMPS_INITIAUX = { nom: "", prenom: "", telephone: "", niveau: "", formation: "" };

function Profil() {
  const navigate = useNavigate();
  const [profil, setProfil] = useState(null);
  const [formulaire, setFormulaire] = useState(CHAMPS_INITIAUX);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [ancienMotDePasse, setAncienMotDePasse] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");

  useEffect(() => {
    let actif = true;
    const recupererProfil = async () => {
      try {
        const response = await fetch(`${API}/api/etudiants/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Impossible de charger votre profil.");
        const etudiant = data[0];
        if (!etudiant) throw new Error("Aucune information de profil n’a été trouvée.");
        if (actif) {
          setProfil(etudiant);
          setFormulaire({
            nom: etudiant.etudiant_nom || "",
            prenom: etudiant.etudiant_prenom || "",
            telephone: etudiant.etudiant_telephone || "",
            niveau: etudiant.etudiant_niveau || "",
            formation: etudiant.etudiant_formation || "",
          });
        }
      } catch (error) {
        if (actif) setErreur(error.message || "Impossible de charger votre profil.");
      } finally {
        if (actif) setChargement(false);
      }
    };
    recupererProfil();
    return () => { actif = false; };
  }, [navigate]);

  function modifierChamp(event) {
    setFormulaire((ancien) => ({ ...ancien, [event.target.name]: event.target.value }));
  }

  async function enregistrerProfil(event) {
    event.preventDefault();
    setErreur("");
    setMessage("");
    try {
      const response = await fetch(`${API}/api/etudiants/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formulaire),
      });
      const data = await response.json();
      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      if (!response.ok) throw new Error(data.message || "La mise à jour du profil a échoué.");
      setProfil((actuel) => ({ ...actuel, ...Object.fromEntries(Object.entries(formulaire).map(([cle, valeur]) => [`etudiant_${cle}`, valeur])) }));
      setMessage(data.message || "Votre profil a été mis à jour.");
    } catch (error) {
      setErreur(error.message || "Impossible de mettre à jour votre profil.");
    }
  }

  async function changerMotDePasse(event) {
    event.preventDefault();
    setErreur("");
    setMessage("");
    if (nouveauMotDePasse !== confirmationMotDePasse) {
      setErreur("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }
    try {
      const response = await fetch(`${API}/api/etudiants/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ancienMotDePasse, nouveauMotDePasse }),
      });
      const data = await response.json();
      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      if (!response.ok) throw new Error(data.message || "Le changement de mot de passe a échoué.");
      setAncienMotDePasse("");
      setNouveauMotDePasse("");
      setConfirmationMotDePasse("");
      setMessage(data.message || "Votre mot de passe a été modifié.");
    } catch (error) {
      setErreur(error.message || "Impossible de changer votre mot de passe.");
    }
  }

  return (
    <div className="min-h-screen bg-campus-paper pb-16">
      <NavBar />
      <main className="mx-auto w-[min(100%_-_2rem,_80rem)] pt-7 sm:pt-10">
        <header className="grid gap-6 border-b border-stone-300 pb-7 sm:grid-cols-[1fr_auto] sm:items-end sm:pb-9">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Espace étudiant · Compte</p>
            <h1 className="font-serif text-4xl leading-tight text-campus-ink sm:text-5xl">Mon profil</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">Consultez et actualisez vos informations personnelles et académiques.</p>
          </div>
          <img className="hidden h-20 w-36 border border-stone-200 object-cover sm:block" src={graduationImage} alt="Diplômés célébrant leur réussite universitaire" />
        </header>

        {erreur && <p role="alert" className="mt-6 border-l-4 border-red-700 bg-red-50 p-4 text-sm text-red-800">{erreur}</p>}
        {message && <p role="status" className="mt-6 border-l-4 border-emerald-700 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}

        {chargement ? (
          <p className="mt-8 border border-stone-200 bg-white p-6 text-stone-600">Chargement des informations du profil…</p>
        ) : profil ? (
          <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
            <section className="border border-stone-200 bg-white p-5 sm:p-8" aria-labelledby="informations-title">
              <div className="mb-6 border-b border-stone-200 pb-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-campus-green">Dossier étudiant</p>
                <h2 id="informations-title" className="mt-2 font-serif text-2xl text-campus-ink">Informations personnelles</h2>
                <p className="mt-2 text-sm text-stone-600">Les informations académiques sont utilisées pour le suivi de votre mémoire.</p>
              </div>
              <form onSubmit={enregistrerProfil} className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-stone-700" htmlFor="prenom">Prénom
                  <input className="mt-1.5 min-h-11 w-full rounded-sm border border-stone-300 px-3 py-2 font-normal text-campus-ink outline-none focus:border-campus-green focus:ring-2 focus:ring-campus-green/15" id="prenom" name="prenom" type="text" autoComplete="given-name" required value={formulaire.prenom} onChange={modifierChamp} />
                </label>
                <label className="text-sm font-semibold text-stone-700" htmlFor="nom">Nom
                  <input className="mt-1.5 min-h-11 w-full rounded-sm border border-stone-300 px-3 py-2 font-normal text-campus-ink outline-none focus:border-campus-green focus:ring-2 focus:ring-campus-green/15" id="nom" name="nom" type="text" autoComplete="family-name" required value={formulaire.nom} onChange={modifierChamp} />
                </label>
                <label className="text-sm font-semibold text-stone-700" htmlFor="matricule">Matricule
                  <input className="mt-1.5 min-h-11 w-full rounded-sm border border-stone-200 bg-stone-50 px-3 py-2 font-normal text-stone-600" id="matricule" type="text" value={profil.etudiant_matricule || ""} readOnly />
                </label>
                <label className="text-sm font-semibold text-stone-700" htmlFor="telephone">Téléphone
                  <input className="mt-1.5 min-h-11 w-full rounded-sm border border-stone-300 px-3 py-2 font-normal text-campus-ink outline-none focus:border-campus-green focus:ring-2 focus:ring-campus-green/15" id="telephone" name="telephone" type="tel" autoComplete="tel" value={formulaire.telephone} onChange={modifierChamp} />
                </label>
                <label className="text-sm font-semibold text-stone-700" htmlFor="niveau">Niveau d’études
                  <input className="mt-1.5 min-h-11 w-full rounded-sm border border-stone-300 px-3 py-2 font-normal text-campus-ink outline-none focus:border-campus-green focus:ring-2 focus:ring-campus-green/15" id="niveau" name="niveau" type="text" value={formulaire.niveau} onChange={modifierChamp} />
                </label>
                <label className="text-sm font-semibold text-stone-700 sm:col-span-2" htmlFor="formation">Formation
                  <input className="mt-1.5 min-h-11 w-full rounded-sm border border-stone-300 px-3 py-2 font-normal text-campus-ink outline-none focus:border-campus-green focus:ring-2 focus:ring-campus-green/15" id="formation" name="formation" type="text" value={formulaire.formation} onChange={modifierChamp} />
                </label>
                <button className="mt-2 min-h-11 w-fit rounded-sm bg-campus-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#244a38] sm:col-span-2" type="submit">Enregistrer les informations</button>
              </form>
            </section>

            <section className="h-fit border border-stone-200 bg-white p-5 sm:p-8" aria-labelledby="password-title">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-campus-green">Sécurité</p>
              <h2 id="password-title" className="mt-2 font-serif text-2xl text-campus-ink">Changer le mot de passe</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">Choisissez un mot de passe personnel pour protéger votre compte.</p>
              <form onSubmit={changerMotDePasse} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold text-stone-700" htmlFor="ancienMotDePasse">Mot de passe actuel
                  <input className="mt-1.5 min-h-11 w-full rounded-sm border border-stone-300 px-3 py-2 font-normal text-campus-ink outline-none focus:border-campus-green focus:ring-2 focus:ring-campus-green/15" id="ancienMotDePasse" type="password" autoComplete="current-password" required value={ancienMotDePasse} onChange={(event) => setAncienMotDePasse(event.target.value)} />
                </label>
                <label className="block text-sm font-semibold text-stone-700" htmlFor="nouveauMotDePasse">Nouveau mot de passe
                  <input className="mt-1.5 min-h-11 w-full rounded-sm border border-stone-300 px-3 py-2 font-normal text-campus-ink outline-none focus:border-campus-green focus:ring-2 focus:ring-campus-green/15" id="nouveauMotDePasse" type="password" autoComplete="new-password" minLength={8} required value={nouveauMotDePasse} onChange={(event) => setNouveauMotDePasse(event.target.value)} />
                </label>
                <label className="block text-sm font-semibold text-stone-700" htmlFor="confirmationMotDePasse">Confirmer le nouveau mot de passe
                  <input className="mt-1.5 min-h-11 w-full rounded-sm border border-stone-300 px-3 py-2 font-normal text-campus-ink outline-none focus:border-campus-green focus:ring-2 focus:ring-campus-green/15" id="confirmationMotDePasse" type="password" autoComplete="new-password" minLength={8} required value={confirmationMotDePasse} onChange={(event) => setConfirmationMotDePasse(event.target.value)} />
                </label>
                <button className="min-h-11 rounded-sm border border-campus-green px-5 py-3 text-sm font-semibold text-campus-green transition hover:bg-campus-green hover:text-white" type="submit">Mettre à jour le mot de passe</button>
              </form>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default Profil;
