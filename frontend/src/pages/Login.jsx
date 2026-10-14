import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import appLogo from "../assets/LogoApp1.jpg";
import libraryImage from "../assets/university-library.jpg";
import researchImage from "../assets/students-research.jpg";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function seConnecter(event) {
    event.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Connexion impossible.");
      const decoded = jwtDecode(data.token);
      localStorage.setItem("token", data.token);
      if (decoded.role === "ADMIN") navigate("/admin", { replace: true });
      else if (decoded.role === "ENCADREUR") navigate("/encadreur", { replace: true });
      else if (decoded.role === "ETUDIANT") navigate("/dashboard", { replace: true });
      else throw new Error("Le rôle de ce compte n'est pas reconnu.");
    } catch (error) {
      setErreur(error.message || "Impossible de joindre le serveur.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="flex h-dvh min-h-[560px] flex-col overflow-hidden bg-campus-paper">
      <header className="flex h-14 shrink-0 items-center border-b border-stone-200 bg-white px-4 sm:h-16 sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <Link className="flex items-center gap-3 text-campus-ink no-underline" to="/login">
            <img className="h-10 w-10 rounded-full object-cover sm:h-11 sm:w-11" src={appLogo} alt="" />
            <span className="font-serif text-base font-semibold sm:text-xl">Gestion des mémoires</span>
          </Link>
          <p className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 sm:block">Espace universitaire</p>
        </div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-0 overflow-hidden bg-campus-ink lg:block" aria-label="La recherche universitaire">
          <img className="absolute inset-0 h-full w-full object-cover" src={libraryImage} alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-campus-ink/90 via-campus-ink/35 to-campus-ink/10" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/80">Recherche · Accompagnement · Réussite</p>
            <h1 className="max-w-xl font-serif text-4xl leading-tight xl:text-5xl">Chaque mémoire commence par une question.</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/85">Un espace de travail pour faire avancer vos idées, échanger avec votre encadreur et préparer sereinement la suite.</p>
          </div>
          <img className="absolute right-8 top-8 h-28 w-36 border-4 border-white object-cover shadow-xl xl:right-12 xl:top-12 xl:h-36 xl:w-48" src={researchImage} alt="" />
        </section>

        <section className="flex min-h-0 items-center justify-center overflow-y-auto px-5 py-5 sm:px-8 lg:overflow-hidden lg:px-12 xl:px-20">
          <div className="animate-fade-up w-full max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Votre espace de travail</p>
            <h2 className="mt-2 font-serif text-3xl leading-tight text-campus-ink sm:text-4xl">Heureux de vous retrouver.</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600 sm:text-base">Connectez-vous pour accéder à votre espace de suivi académique.</p>
            {erreur && <p role="alert" className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800">{erreur}</p>}

            <form onSubmit={seConnecter} className="mt-5 space-y-4">
              <label htmlFor="email" className="block text-sm font-semibold text-stone-700">Adresse e-mail
                <input className="mt-1.5 min-h-11 w-full rounded-sm border border-stone-300 bg-white px-3 py-2 text-base text-campus-ink outline-none transition focus:border-campus-green focus:ring-2 focus:ring-campus-green/15" id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@universite.edu" />
              </label>
              <label htmlFor="motDePasse" className="block text-sm font-semibold text-stone-700">Mot de passe
                <input className="mt-1.5 min-h-11 w-full rounded-sm border border-stone-300 bg-white px-3 py-2 text-base text-campus-ink outline-none transition focus:border-campus-green focus:ring-2 focus:ring-campus-green/15" id="motDePasse" type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
              </label>
              <button disabled={chargement} className="min-h-11 w-full rounded-sm bg-campus-green px-5 py-3 text-sm font-bold text-white transition hover:bg-[#244a38] disabled:opacity-60" type="submit">{chargement ? "Connexion…" : "Se connecter"}</button>
            </form>

            <p className="mt-5 border-t border-stone-200 pt-4 text-sm leading-6 text-stone-600">Vous n’avez pas encore de compte ? <Link className="font-bold text-campus-green underline underline-offset-4 hover:text-[#244a38]" to="/">Créer un compte étudiant</Link></p>
            <p className="mt-4 text-xs leading-5 text-stone-500">Plateforme de gestion et de suivi des mémoires universitaires.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
