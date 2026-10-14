
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import studentsResearchImage from "../../assets/students-research.jpg";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

function AdminDashboard() {
    const [stats, setStats] = useState({
        etudiants: 0,
        encadreurs: 0,
        memoires: 0,
        soutenances: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const chargerStats = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await fetch(
                    `${API}/api/admin/stats`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    console.error(data.message);
                    return;
                }

                setStats(data);

            } catch (error) {
                console.error(
                    "Erreur lors du chargement des statistiques :",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        chargerStats();
    }, []);

    return (
        <div className="animate-fade-up">
            <section className="grid overflow-hidden bg-campus-green text-white md:grid-cols-[1.1fr_0.9fr]">
                <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/75">Espace de pilotage</p>
                    <h1 className="max-w-2xl font-serif text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">Faire grandir la recherche, ensemble.</h1>
                    <p className="mt-4 max-w-xl leading-7 text-white/80">Suivez les mémoires, accompagnez les équipes pédagogiques et organisez les étapes clés de l’année universitaire.</p>
                </div>
                <img className="h-52 w-full object-cover md:h-full md:min-h-64" src={studentsResearchImage} alt="Étudiants collaborant sur un projet universitaire" />
            </section>

            <div className="mb-5 mt-9 flex flex-wrap items-end justify-between gap-3 border-b border-stone-300 pb-4">
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Indicateurs</p>
                    <h2 className="font-serif text-2xl text-campus-ink sm:text-3xl">Vue d’ensemble</h2>
                </div>
                <p className="text-sm text-stone-600">Les chiffres clés de la plateforme.</p>
            </div>

            {loading ? (
                <p className="border border-stone-200 bg-white p-5 text-stone-600">Chargement des statistiques…</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="border border-stone-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md">
                        <p className="text-sm font-medium text-stone-600">Étudiants inscrits</p>
                        <strong className="mt-3 block font-serif text-4xl text-campus-ink">{stats.etudiants}</strong>
                        <p className="mt-2 text-xs text-stone-500">Membres de la communauté</p>
                    </article>
                    <article className="border border-stone-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md">
                        <p className="text-sm font-medium text-stone-600">Encadreurs</p>
                        <strong className="mt-3 block font-serif text-4xl text-campus-ink">{stats.encadreurs}</strong>
                        <p className="mt-2 text-xs text-stone-500">Experts qui accompagnent</p>
                    </article>
                    <article className="border border-stone-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md">
                        <p className="text-sm font-medium text-stone-600">Mémoires suivis</p>
                        <strong className="mt-3 block font-serif text-4xl text-campus-ink">{stats.memoires}</strong>
                        <p className="mt-2 text-xs text-stone-500">Projets de recherche</p>
                    </article>
                    <article className="border border-stone-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md">
                        <p className="text-sm font-medium text-stone-600">Soutenances</p>
                        <strong className="mt-3 block font-serif text-4xl text-campus-ink">{stats.soutenances ?? 0}</strong>
                        <p className="mt-2 text-xs text-stone-500">Étapes vers la réussite</p>
                    </article>
                </div>
            )}

            <section className="mt-10">
                <div className="mb-5 border-b border-stone-300 pb-4">
                    <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Accès rapides</p>
                        <h2 className="font-serif text-2xl text-campus-ink sm:text-3xl">Que souhaitez-vous gérer ?</h2>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                    <Link to="/admin/encadreurs" className="group flex items-center justify-between gap-4 border-b border-stone-200 py-5 text-campus-ink no-underline transition hover:text-campus-green">
                        <div><h3 className="font-serif text-xl">Équipe pédagogique</h3><p className="mt-1 text-sm text-stone-600">Consultez et gérez les encadreurs.</p></div>
                        <span className="text-xl transition group-hover:translate-x-1" aria-hidden="true">→</span>
                    </Link>
                    <Link to="/admin/affectations" className="group flex items-center justify-between gap-4 border-b border-stone-200 py-5 text-campus-ink no-underline transition hover:text-campus-green">
                        <div><h3 className="font-serif text-xl">Affectations</h3><p className="mt-1 text-sm text-stone-600">Associez les mémoires à leurs encadreurs.</p></div>
                        <span className="text-xl transition group-hover:translate-x-1" aria-hidden="true">→</span>
                    </Link>
                    <Link to="/admin/memoires" className="group flex items-center justify-between gap-4 border-b border-stone-200 py-5 text-campus-ink no-underline transition hover:text-campus-green">
                        <div><h3 className="font-serif text-xl">Suivi des mémoires</h3><p className="mt-1 text-sm text-stone-600">Parcourez les projets en cours.</p></div>
                        <span className="text-xl transition group-hover:translate-x-1" aria-hidden="true">→</span>
                    </Link>
                    <Link to="/admin/soutenances" className="group flex items-center justify-between gap-4 border-b border-stone-200 py-5 text-campus-ink no-underline transition hover:text-campus-green">
                        <div><h3 className="font-serif text-xl">Calendrier des soutenances</h3><p className="mt-1 text-sm text-stone-600">Organisez et planifiez les échéances.</p></div>
                        <span className="text-xl transition group-hover:translate-x-1" aria-hidden="true">→</span>
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default AdminDashboard;
