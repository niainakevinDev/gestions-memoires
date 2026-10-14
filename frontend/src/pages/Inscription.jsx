import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import appLogo from "../assets/LogoApp1.jpg";
import campusImage from "../assets/university-campus.jpg";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const CHAMPS_INITIAUX = { nom: "", prenom: "", email: "", matricule: "", motDePasse: "", telephone: "", niveau: "", formation: "" };

function Inscription() {
  const navigate = useNavigate();
  const [formulaire, setFormulaire] = useState(CHAMPS_INITIAUX);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [chargement, setChargement] = useState(false);

  function modifierChamp(event) {
    setFormulaire((ancien) => ({ ...ancien, [event.target.name]: event.target.value }));
  }

  async function envoyerEtudiant(event) {
    event.preventDefault();
    setErreur("");
    setMessage("");
    setChargement(true);
    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulaire),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "L'inscription a échoué.");
      setMessage("Inscription réussie. Vous pouvez maintenant vous connecter.");
      setFormulaire(CHAMPS_INITIAUX);
      window.setTimeout(() => navigate("/login"), 900);
    } catch (error) {
      setErreur(error.message || "Impossible de joindre le serveur.");
    } finally {
      setChargement(false);
    }
  }

  const champs = [
    ["nom", "Nom", "text", true],
    ["prenom", "Prénom", "text", true],
    ["matricule", "Matricule", "text", true],
    ["niveau", "Niveau (ex. L2, M2)", "text", true],
    ["formation", "Formation", "text", true],
    ["telephone", "Téléphone (facultatif)", "tel", false],
    ["email", "Adresse e-mail", "email", true],
    ["motDePasse", "Mot de passe (8 caractères min.)", "password", true],
  ];

  return (
    <main className="flex h-dvh min-h-[580px] flex-col overflow-hidden bg-campus-paper">
      <header className="flex h-14 shrink-0 items-center border-b border-stone-200 bg-white px-4 sm:h-16 sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <Link className="flex items-center gap-2.5 text-campus-ink no-underline sm:gap-3" to="/">
            <img className="h-9 w-9 rounded-full object-cover sm:h-11 sm:w-11" src={appLogo} alt="" />
            <span className="font-serif text-sm font-semibold sm:text-xl">Gestion des mémoires</span>
          </Link>
          <Link className="shrink-0 text-xs font-semibold text-campus-green underline underline-offset-4 sm:text-sm" to="/login">Déjà inscrit ? Se connecter</Link>
        </div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-[0.78fr_1.22fr]">
        <section className="relative hidden min-h-0 overflow-hidden bg-campus-ink lg:block" aria-label="La vie universitaire">
          <img className="absolute inset-0 h-full w-full object-cover" src={campusImage} alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-campus-ink/90 via-campus-ink/30 to-campus-ink/10" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-white xl:p-12">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/80">Un projet · Un parcours · Une réussite</p>
            <h1 className="max-w-lg font-serif text-4xl leading-tight xl:text-5xl">Votre recherche mérite un bon départ.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/85">Créez votre espace étudiant pour déposer vos versions et collaborer avec votre encadreur.</p>
          </div>
        </section>

        <section className="flex min-h-0 items-center justify-center overflow-y-auto px-4 py-3 sm:px-8 lg:overflow-hidden lg:px-10 xl:px-16">
          <div className="animate-fade-up w-full max-w-3xl">
            <div className="mb-3 sm:mb-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-campus-green sm:text-xs">Inscription étudiante</p>
              <h2 className="mt-1 font-serif text-2xl leading-tight text-campus-ink sm:text-3xl">Créer votre compte</h2>
              <p className="mt-1 text-xs leading-5 text-stone-600 sm:text-sm">Renseignez vos informations pour démarrer le suivi de votre mémoire.</p>
            </div>

            {erreur && <p role="alert" className="mb-3 border-l-4 border-red-700 bg-red-50 p-2.5 text-xs text-red-800 sm:text-sm">{erreur}</p>}
            {message && <p role="status" className="mb-3 border-l-4 border-emerald-700 bg-emerald-50 p-2.5 text-xs text-emerald-800 sm:text-sm">{message}</p>}

            <form onSubmit={envoyerEtudiant} className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-5 sm:gap-y-3">
              {champs.map(([name, label, type, required]) => (
                <label key={name} htmlFor={name} className="block min-w-0 text-xs font-semibold leading-4 text-stone-700 sm:text-sm sm:leading-5">
                  {label}
                  <input className="mt-1 min-h-10 w-full rounded-sm border border-stone-300 bg-white px-2.5 py-2 text-sm font-normal text-campus-ink outline-none transition focus:border-campus-green focus:ring-2 focus:ring-campus-green/15 sm:min-h-11 sm:px-3 sm:text-base" id={name} name={name} type={type} required={required} minLength={name === "motDePasse" ? 8 : undefined} maxLength={name === "motDePasse" ? 72 : undefined} autoComplete={name === "motDePasse" ? "new-password" : name === "email" ? "email" : name === "nom" ? "family-name" : name === "prenom" ? "given-name" : "on"} value={formulaire[name]} onChange={modifierChamp} />
                </label>
              ))}
              <button disabled={chargement} type="submit" className="col-span-2 mt-1 min-h-10 rounded-sm bg-campus-green px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#244a38] disabled:opacity-60 sm:min-h-11">{chargement ? "Création du compte…" : "Créer mon compte étudiant"}</button>
            </form>

            <p className="mt-3 border-t border-stone-200 pt-2.5 text-xs text-stone-600 sm:mt-4 sm:pt-3 sm:text-sm">En créant votre compte, vous pourrez suivre votre mémoire et échanger avec votre encadreur.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Inscription;
