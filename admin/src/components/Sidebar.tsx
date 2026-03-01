"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Utensils, Receipt, BarChart3, Settings, LogOut } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        setUserRole(localStorage.getItem("jaffs_user_role"));
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post("/api/auth/logout");
            Cookies.remove("admin_token");
            localStorage.removeItem("jaffs_user_role");
            toast("Sesión cerrada correctamente", { icon: "👋" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            toast.error("Error al cerrar sesión");
        }
    };

    let menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: Receipt, label: "Órdenes Activas", href: "/dashboard/orders" },
        { icon: Utensils, label: "Gestión Carta", href: "/dashboard/menu" },
        { icon: BarChart3, label: "Reportes", href: "/dashboard/reports" },
        { icon: Settings, label: "Ajustes", href: "/dashboard/settings" },
    ];

    if (userRole === "employee") {
        menuItems = [
            { icon: Receipt, label: "Órdenes Activas", href: "/dashboard/orders" }
        ];
    }

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-zinc-950 border-r border-zinc-800 z-50 flex flex-col">
            <div className="h-20 flex items-center px-8 border-b border-zinc-900">
                <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                    JAFF&apos;S LOMOS
                </h2>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.href) &&
                        (item.href === "/dashboard" ? pathname === "/dashboard" : true);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive
                                ? "bg-orange-500/10 text-orange-500"
                                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? "text-orange-500" : ""}`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-900">
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 mb-4">
                    <p className="text-sm font-medium text-zinc-300">Sesión Activa</p>
                    <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">
                        {userRole === "admin" ? "Administrador" : userRole === "employee" ? "Empleado" : "Cargando..."}
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900/40 hover:bg-red-500/10 border border-zinc-800/80 hover:border-red-500/30 rounded-xl transition-all text-sm font-medium text-zinc-400 hover:text-red-400"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}
