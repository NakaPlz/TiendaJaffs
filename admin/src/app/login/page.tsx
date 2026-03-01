"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ChevronRight, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function LoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return toast.error("Por favor ingresa la contraseña");

        setIsLoading(true);

        try {
            const response = await axios.post("/api/auth/login", { password });
            localStorage.setItem("jaffs_user_role", response.data.role);
            toast.success("¡Bienvenido/a de regreso!");

            if (response.data.role === "employee") {
                router.push("/dashboard/orders");
            } else {
                router.push("/dashboard");
            }
            router.refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Contraseña incorrecta. Acceso denegado.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
            {/* Premium Background Effects */}
            <div className="absolute inset-0 bg-zinc-950" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/60 p-8 rounded-3xl shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/40">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                            Jaff&apos;s Lomos
                        </h1>
                        <p className="text-zinc-400 font-medium">Panel de Administración</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-zinc-300 mb-2"
                            >
                                Clave de Acceso
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-orange-900/20 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Ingresar al Sistema
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-zinc-500 text-sm mt-8">
                    Acceso restringido. Sistema protegido.
                </p>
            </div>
        </div>
    );
}
