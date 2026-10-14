import { Link } from "react-router-dom";
import NavBar from "../components/Navbar";
import SoutenancesMes from "../components/SoutenancesMes";
import campusImage from "../assets/university-campus.jpg";
import libraryImage from "../assets/library-reading-room.jpg";
import studyImage from "../assets/section1.jpg";
import researchImage from "../assets/students-research.jpg";
import thesisImage from "../assets/b1e120551fb959c7c484fc0dd6c23f30.jpg";

const parcours = [
  {
    image: studyImage,
    alt: "Ordinateur et documents de recherche sur une table de travail",
    rubrique: "Recherche",
    titre: "Donner forme à ses idées",
    texte: "Retrouvez vos documents et les échanges liés à votre mémoire dans votre espace dédié.",
  },
  {
    image: researchImage,
    alt: "Étudiants qui collaborent sur un projet de recherche",
    rubrique: "Accompagnement",
    titre: "Construire ensemble",
    texte: "Gardez le fil de votre collaboration avec votre encadreur tout au long du parcours.",
  },
  {
    image: thesisImage,
    alt: "Livres et chapeau de diplômé symbolisant l’aboutissement des études",
    rubrique: "Réussite",
    titre: "Garder le cap jusqu’à la soutenance",
    texte: "Préparez sereinement les dernières étapes de votre travail universitaire.",
  },
];

function Dashboard() {
  return (
    <div className="min-h-screen bg-campus-paper pb-16">
      <NavBar />
      <main className="mx-auto w-[min(100%_-_2rem,_80rem)] pt-6 sm:pt-10">
        <section className="animate-fade-up grid overflow-hidden border border-stone-200 bg-white lg:min-h-[440px] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12 xl:px-16">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-campus-green">Votre parcours de recherche</p>
            <h1 className="max-w-xl font-serif text-4xl leading-[1.08] tracking-tight text-campus-ink sm:text-5xl xl:text-6xl">Les idées d’aujourd’hui font la recherche de demain.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-stone-600">Un espace pour approfondir vos idées, suivre votre mémoire et avancer avec votre encadreur, étape après étape.</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link to="/memoire" className="inline-flex min-h-11 items-center gap-3 bg-campus-green px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-[#244a38]">
                Accéder à mon mémoire <span aria-hidden="true">→</span>
              </Link>
              <Link to="/dashboard#soutenances" className="text-sm font-semibold text-campus-green underline underline-offset-4 hover:text-[#244a38]">Voir les soutenances</Link>
            </div>
          </div>
          <figure className="relative min-h-64 overflow-hidden bg-stone-200 sm:min-h-80 lg:min-h-full">
            <img className="absolute inset-0 h-full w-full object-cover" src={campusImage} alt="Diplômés célébrant leur réussite universitaire sur le campus" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-6 pb-5 pt-20 text-sm font-medium text-white sm:px-8 sm:pb-7">Curiosité, engagement et réussite universitaire.</figcaption>
          </figure>
        </section>

        <section className="mt-12 sm:mt-16" aria-labelledby="outils-title">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Votre espace académique</p>
              <h2 id="outils-title" className="font-serif text-2xl text-campus-ink sm:text-3xl">Poursuivre votre parcours</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-stone-600">Accédez rapidement aux outils et aux informations utiles pour votre travail de recherche.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/memoire" className="group flex min-h-32 items-center justify-between gap-4 border border-stone-200 bg-white p-5 text-campus-ink no-underline transition hover:border-campus-green hover:shadow-sm sm:p-6">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-campus-green">Espace de travail</p><h3 className="mt-2 font-serif text-xl">Mon mémoire</h3><p className="mt-2 text-sm leading-6 text-stone-600">Déposer une version et suivre son avancement.</p></div>
              <span className="text-2xl text-campus-green transition group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
            <Link to="/dashboard#soutenances" className="group flex min-h-32 items-center justify-between gap-4 border border-stone-200 bg-white p-5 text-campus-ink no-underline transition hover:border-campus-green hover:shadow-sm sm:p-6">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-campus-green">Calendrier académique</p><h3 className="mt-2 font-serif text-xl">Mes soutenances</h3><p className="mt-2 text-sm leading-6 text-stone-600">Consulter les dates et les informations pratiques.</p></div>
              <span className="text-2xl text-campus-green transition group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
            <Link to="/profil" className="group flex min-h-32 items-center justify-between gap-4 border border-stone-200 bg-white p-5 text-campus-ink no-underline transition hover:border-campus-green hover:shadow-sm sm:p-6">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-campus-green">Compte étudiant</p><h3 className="mt-2 font-serif text-xl">Mon profil</h3><p className="mt-2 text-sm leading-6 text-stone-600">Consulter et mettre à jour vos informations.</p></div>
              <span className="text-2xl text-campus-green transition group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <SoutenancesMes />

        <section className="mt-12 border-y border-stone-300 py-9 sm:mt-16 sm:py-12" aria-labelledby="recherche-title">
          <div className="mb-6 max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Au cœur de la vie universitaire</p>
            <h2 id="recherche-title" className="font-serif text-3xl leading-tight text-campus-ink sm:text-4xl">Un lieu pour apprendre, chercher et partager.</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">La recherche se construit dans les livres, les échanges et les idées qui circulent.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
            <figure className="group relative min-h-64 overflow-hidden bg-stone-200 md:min-h-96">
              <img className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" src={libraryImage} alt="Rayonnages de livres dans une bibliothèque de recherche" loading="lazy" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-5 pt-16 font-serif text-xl text-white sm:px-7 sm:pb-7 sm:text-2xl">La bibliothèque, point de départ de nouvelles idées.</figcaption>
            </figure>
            <div className="grid gap-4">
              {parcours.map(({ image, alt, rubrique, titre, texte }) => (
                <article key={titre} className="group grid overflow-hidden border border-stone-200 bg-white sm:grid-cols-[0.85fr_1.15fr]">
                  <img className="h-44 w-full object-cover sm:h-full sm:min-h-48" src={image} alt={alt} loading="lazy" />
                  <div className="p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-campus-green">{rubrique}</p>
                    <h3 className="mt-2 font-serif text-xl text-campus-ink">{titre}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{texte}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
