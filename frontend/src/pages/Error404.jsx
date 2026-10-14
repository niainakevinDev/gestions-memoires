import Logo from "../assets/LogoApp1.jpg";
import errorBackground from "../assets/university-library.jpg";
import researchImage from "../assets/students-research.jpg";
import { Link } from "react-router-dom";

function Error() {
    return (
        <main className="grid min-h-screen place-items-center bg-campus-paper p-5 sm:p-8">
            <section className="grid w-full max-w-5xl overflow-hidden border border-stone-200 bg-white shadow-sm md:grid-cols-[1fr_1fr]">
                <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                    <img className="mb-7 h-16 w-16 rounded-full object-cover" src={Logo} alt="Emblème de l’université" />
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Erreur 404</p>
                    <h1 className="font-serif text-3xl leading-tight text-campus-ink sm:text-4xl">Cette page est introuvable.</h1>
                    <p className="mt-4 leading-7 text-stone-600">Le lien a peut-être changé ou la page n’existe plus. Vous pouvez revenir à votre espace et continuer votre parcours.</p>
                    <Link className="mt-7 inline-flex min-h-11 w-fit items-center bg-campus-green px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-[#244a38]" to="/login">Retourner à l’accueil</Link>
                </div>
                <div className="relative min-h-64 bg-campus-paper md:min-h-[480px]">
                    <img className="absolute inset-0 h-full w-full object-cover opacity-60" src={errorBackground} alt="" />
                    <img className="absolute inset-x-6 bottom-6 h-44 w-[calc(100%-3rem)] object-cover shadow-lg sm:inset-x-10 sm:bottom-10 sm:h-56 sm:w-[calc(100%-5rem)]" src={researchImage} alt="Étudiants collaborant sur un projet universitaire" />
                    <p className="absolute left-6 top-6 bg-white/90 px-4 py-2 font-serif text-lg text-campus-ink sm:left-10 sm:top-10">Poursuivez votre parcours.</p>
                </div>
            </section>
        </main>
    );
}

export default Error;
