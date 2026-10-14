
import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";

function AdminLayout() {
    return (
        <div className="min-h-screen bg-campus-paper">
            <AdminNavbar />
            <main className="mx-auto w-[min(100%-2rem,78rem)] py-8 sm:py-10">
                <Outlet />
            </main>
        </div>
    );
}

export default AdminLayout;
