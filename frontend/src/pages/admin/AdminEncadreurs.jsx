
import { useEffect, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

function AdminEncadreurs() {
    const [encadreurs, setEncadreurs] = useState([]);
    const [loading, setLoading] = useState(true);


    const chargerEncadreurs = async () => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `${API}/api/admin/encadreurs`,
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

        setEncadreurs(data);

    } catch (error) {
        console.error(
            "Erreur lors du chargement des encadreurs :",
            error
        );
    }
};

useEffect(() => {
    const charger = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API}/api/admin/encadreurs`,
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

            setEncadreurs(data);

        } catch (error) {
            console.error(
                "Erreur lors du chargement des encadreurs :",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    charger();
}, []);


    

    const [formulaire, setFormulaire] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    email: "",
    motDePasse: "",
    telephone: "",
    specialite: "",
    grade: ""
});

    const ajouterEncadreur = async (e) => {
    e.preventDefault();

    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `${API}/api/admin/encadreurs`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formulaire)
            }
        );

        const data = await response.json();

        console.log("Réponse :", data);

        if (!response.ok) {
            alert(data.message);
            return;
        }

        alert(data.message);
        await chargerEncadreurs();

        // Réinitialiser le formulaire
        setFormulaire({
            matricule: "",
            nom: "",
            prenom: "",
            email: "",
            motDePasse: "",
            telephone: "",
            specialite: "",
            grade: ""
        });

    } catch (error) {
        console.error("Erreur :", error);
    }
};
    

   


    return (
        <div>

            <div className="mb-7 border-b border-stone-300 pb-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-campus-green">Équipe pédagogique</p>
                <h1 className="font-serif text-3xl text-campus-ink sm:text-4xl">
                    Gestion des encadreurs
                </h1>

                <p className="mt-2 text-stone-600">
                    Consultez les encadreurs enregistrés sur la plateforme.
                </p>
            </div>

            <form
    onSubmit={ajouterEncadreur}
    className="mb-8 border border-stone-200 bg-white p-5 sm:p-6"
>
    <h2 className="mb-6 font-serif text-xl">
        Ajouter un encadreur
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <input
            type="text"
            placeholder="Matricule"
            value={formulaire.matricule}
            onChange={(e) =>
                setFormulaire({
                    ...formulaire,
                    matricule: e.target.value
                })
            }
            className="min-h-11 rounded-sm border border-stone-300 px-3 py-2"
        />

        <input
            type="text"
            placeholder="Nom"
            value={formulaire.nom}
            onChange={(e) =>
                setFormulaire({
                    ...formulaire,
                    nom: e.target.value
                })
            }
            className="min-h-11 rounded-sm border border-stone-300 px-3 py-2"
        />

        <input
            type="text"
            placeholder="Prénom"
            value={formulaire.prenom}
            onChange={(e) =>
                setFormulaire({
                    ...formulaire,
                    prenom: e.target.value
                })
            }
            className="min-h-11 rounded-sm border border-stone-300 px-3 py-2"
        />

        <input
            type="email"
            placeholder="Email"
            value={formulaire.email}
            onChange={(e) =>
                setFormulaire({
                    ...formulaire,
                    email: e.target.value
                })
            }
            className="min-h-11 rounded-sm border border-stone-300 px-3 py-2"
        />

        <input
            type="password"
            placeholder="Mot de passe"
            value={formulaire.motDePasse}
            onChange={(e) =>
                setFormulaire({
                    ...formulaire,
                    motDePasse: e.target.value
                })
            }
            className="min-h-11 rounded-sm border border-stone-300 px-3 py-2"
        />

        <input
            type="text"
            placeholder="Téléphone"
            value={formulaire.telephone}
            onChange={(e) =>
                setFormulaire({
                    ...formulaire,
                    telephone: e.target.value
                })
            }
            className="min-h-11 rounded-sm border border-stone-300 px-3 py-2"
        />

        <input
            type="text"
            placeholder="Spécialité"
            value={formulaire.specialite}
            onChange={(e) =>
                setFormulaire({
                    ...formulaire,
                    specialite: e.target.value
                })
            }
            className="min-h-11 rounded-sm border border-stone-300 px-3 py-2"
        />

        <input
            type="text"
            placeholder="Grade"
            value={formulaire.grade}
            onChange={(e) =>
                setFormulaire({
                    ...formulaire,
                    grade: e.target.value
                })
            }
            className="min-h-11 rounded-sm border border-stone-300 px-3 py-2"
        />

    </div>

    <button
        type="submit"
        className="mt-6 rounded-sm bg-campus-green px-5 py-3 font-semibold text-white hover:bg-[#244a38]"
    >
        Ajouter l'encadreur
    </button>

</form>


            {loading ? (

                <p className="text-gray-500">
                    Chargement des encadreurs...
                </p>

            ) : encadreurs.length === 0 ? (

                <div className="border border-stone-200 bg-white p-6">
                    <p className="text-gray-500">
                        Aucun encadreur enregistré.
                    </p>
                </div>

            ) : (

                <div className="overflow-hidden border border-stone-200 bg-white">

                    <div className="overflow-x-auto">

                        <table className="w-full">

                            <thead className="bg-campus-green text-white">

                                <tr>
                                    <th className="text-left px-6 py-4">
                                        Matricule
                                    </th>

                                    <th className="text-left px-6 py-4">
                                        Nom
                                    </th>

                                    <th className="text-left px-6 py-4">
                                        Prénom
                                    </th>

                                    <th className="text-left px-6 py-4">
                                        Email
                                    </th>

                                    <th className="text-left px-6 py-4">
                                        Téléphone
                                    </th>

                                    <th className="text-left px-6 py-4">
                                        Spécialité
                                    </th>

                                    <th className="text-left px-6 py-4">
                                        Grade
                                    </th>
                                </tr>

                            </thead>


                            <tbody>

                                {encadreurs.map((encadreur) => (

                                    <tr
                                        key={encadreur.encadreur_id}
                                        className="border-b hover:bg-gray-50"
                                    >

                                        <td className="px-6 py-4">
                                            {encadreur.encadreur_matricule}
                                        </td>

                                        <td className="px-6 py-4 font-medium">
                                            {encadreur.encadreur_nom}
                                        </td>

                                        <td className="px-6 py-4">
                                            {encadreur.encadreur_prenom}
                                        </td>

                                        <td className="px-6 py-4">
                                            {encadreur.user_email}
                                        </td>

                                        <td className="px-6 py-4">
                                            {encadreur.encadreur_telephone || "-"}
                                        </td>

                                        <td className="px-6 py-4">
                                            {encadreur.encadreur_specialite || "-"}
                                        </td>

                                        <td className="px-6 py-4">
                                            {encadreur.encadreur_grade || "-"}
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>

            )}

        </div>
    );
}

export default AdminEncadreurs;
