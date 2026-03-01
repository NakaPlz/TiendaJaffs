import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-zinc-950">
            {/* Sidebar fijo a la izquierda */}
            <Sidebar />

            {/* Contenido principal con padding a la izquierda para dejar lugar al sidebar de 64 (16rem = 256px) */}
            <main className="flex-1 ml-64 min-h-screen">
                {children}
            </main>
        </div>
    );
}
