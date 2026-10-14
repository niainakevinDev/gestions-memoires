import Navbar from "../components/Navbar";
import SoutenancesMes from "../components/SoutenancesMes";
import campusStudy from "../assets/campus-study.jpg";

export default function Soutenances() {
  return (
    <div className="min-h-screen bg-campus-paper">
      <Navbar />
      <main className="mx-auto w-[min(100%_-_2rem,_80rem)] py-8 sm:py-12">
        <section className="relative mb-8 min-h-52 overflow-hidden bg-campus-ink sm:min-h-64">
          <img className="absolute inset-0 h-full w-full object-cover" src={campusStudy} alt="" />
          <div className="absolute inset-0 bg-gradient-to-r from-campus-ink/90 via-campus-ink/65 to-campus-ink/15" />
          <div className="relative flex min-h-52 max-w-2xl flex-col justify-center px-6 py-8 text-white sm:min-h-64 sm:px-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/75">Votre parcours académique</p>
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl">Soutenances</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
              Retrouvez les dates, lieux, membres du jury et informations liées à la présentation de votre mémoire.
            </p>
          </div>
        </section>
        <SoutenancesMes standalone />
      </main>
    </div>
  );
}
