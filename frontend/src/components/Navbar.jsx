import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import appLogo from "../assets/LogoApp1.jpg";

function Navbar() {
    const navigate = useNavigate();
    const [menuOuvert, setMenuOuvert] = useState(false);

    function seDeconnecter() {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
    }

    function fermerMenu() {
        setMenuOuvert(false);
    }

    return (
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
            <nav className="relative mx-auto flex min-h-[72px] w-[min(100%_-_2rem,_80rem)] flex-wrap items-center justify-between gap-3 py-3" aria-label="Navigation principale">
                <Link className="flex shrink-0 items-center gap-3 text-campus-ink no-underline" to="/dashboard">
                    <img className="h-10 w-10 rounded-full object-cover" src={appLogo} alt="" />
                    <span className="font-serif text-sm font-semibold sm:text-base">Gestion des mémoires</span>
                </Link>
                <button
                    className="flex h-10 w-11 flex-col items-center justify-center gap-1.5 rounded-sm border border-stone-300 bg-white md:hidden"
                    type="button"
                    aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
                    aria-expanded={menuOuvert}
                    aria-controls="student-navigation"
                    onClick={() => setMenuOuvert((ouvert) => !ouvert)}
                >
                    <span className="h-0.5 w-[18px] bg-campus-ink" />
                    <span className="h-0.5 w-[18px] bg-campus-ink" />
                    <span className="h-0.5 w-[18px] bg-campus-ink" />
                </button>
                <div id="student-navigation" className={`${menuOuvert ? "flex" : "hidden"} absolute left-0 right-0 top-full z-30 flex-col gap-1 border-t border-stone-200 bg-white py-3 shadow-md md:static md:flex md:w-auto md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent md:py-0 md:shadow-none`}>
                    <NavLink to="/dashboard" end onClick={fermerMenu} className={({ isActive }) => `rounded-sm px-3 py-2 text-sm font-medium no-underline transition hover:bg-campus-paper hover:text-campus-green ${isActive ? "bg-campus-paper text-campus-green" : "text-stone-600"}`}>Accueil</NavLink>
                    <NavLink to="/memoire" onClick={fermerMenu} className={({ isActive }) => `rounded-sm px-3 py-2 text-sm font-medium no-underline transition hover:bg-campus-paper hover:text-campus-green ${isActive ? "bg-campus-paper text-campus-green" : "text-stone-600"}`}>Mémoire</NavLink>
                    <NavLink to="/soutenances" onClick={fermerMenu} className={({ isActive }) => `rounded-sm px-3 py-2 text-sm font-medium no-underline transition hover:bg-campus-paper hover:text-campus-green ${isActive ? "bg-campus-paper text-campus-green" : "text-stone-600"}`}>Soutenances</NavLink>
                    <NavLink to="/profil" onClick={fermerMenu} className={({ isActive }) => `rounded-sm px-3 py-2 text-sm font-medium no-underline transition hover:bg-campus-paper hover:text-campus-green ${isActive ? "bg-campus-paper text-campus-green" : "text-stone-600"}`}>Profil</NavLink>
                    <button className="rounded-sm border border-stone-300 px-3 py-2 text-left text-sm font-semibold text-campus-ink transition hover:bg-campus-paper md:ml-2" type="button" onClick={seDeconnecter}>Déconnexion</button>
                </div>
            </nav>
        </header>
    );
}

export default Navbar;
