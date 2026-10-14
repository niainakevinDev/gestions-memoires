import { BrowserRouter, Route, Routes } from "react-router-dom";
import Error from "./pages/Error404";
import Inscription from "./pages/Inscription";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminEncadreurs from "./pages/admin/AdminEncadreurs";
import Dashboard from "./pages/Dashboard";
import Memoire from "./pages/Memoire";
import Profil from "./pages/Profil";
import AdminAffectations from "./pages/admin/AdminAffectations";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DashboardEncadreur from "./pages/encadreur/DashboardEncadreur";
import AdminMemoires from "./pages/admin/AdminMemoires";
import AdminSoutenances from "./pages/admin/AdminSoutenances";
import Soutenances from "./pages/Soutenances";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Routes Admin */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="encadreurs" element={<AdminEncadreurs />} />
                    <Route
                        path="affectations"
                        element={<AdminAffectations />}
                    />
                    <Route path="memoires" element={<AdminMemoires />} />
                    <Route path="soutenances" element={<AdminSoutenances />} />
                </Route>
                <Route
    path="/encadreur"
    element={
        <ProtectedRoute>
            <DashboardEncadreur />
        </ProtectedRoute>
    }
/>
                <Route path="/memoire" element={<Memoire />} />
                <Route
                    path="/profil"
                    element={
                        <ProtectedRoute>
                            <Profil />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/soutenances"
                    element={
                        <ProtectedRoute>
                            <Soutenances />
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Inscription />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Error />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;