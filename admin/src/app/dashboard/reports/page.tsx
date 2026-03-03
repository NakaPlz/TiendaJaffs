"use client";

import useSWR from "swr";
import axios from "axios";
import { Download, BarChart3, TrendingUp, ShoppingBag, CalendarDays, DollarSign, CreditCard, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useState, useMemo } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const fetcher = (url: string) => axios.get(url).then(res => res.data);

const PERIODS = [
    { key: "7d", label: "7 días" },
    { key: "30d", label: "30 días" },
    { key: "3m", label: "3 meses" },
    { key: "6m", label: "6 meses" },
    { key: "1y", label: "1 año" },
    { key: "3y", label: "3 años" },
];

export default function ReportsPage() {
    const [period, setPeriod] = useState("30d");
    const [showAllProducts, setShowAllProducts] = useState(false);

    const { data: report, isLoading, error } = useSWR(
        `${API_URL}/reports/?period=${period}`,
        fetcher,
        { revalidateOnFocus: false }
    );

    // Timeline max para escala del gráfico
    const timelineMax = useMemo(() => {
        if (!report?.revenue_timeline) return 1;
        return Math.max(...report.revenue_timeline.map((d: any) => d.revenue), 1);
    }, [report]);

    // Weekday max para escala
    const weekdayMax = useMemo(() => {
        if (!report?.by_weekday) return 1;
        return Math.max(...report.by_weekday.map((d: any) => d.avg_revenue), 1);
    }, [report]);

    // Payment max
    const paymentMax = useMemo(() => {
        if (!report?.by_payment_method) return 1;
        return Math.max(...report.by_payment_method.map((d: any) => d.revenue), 1);
    }, [report]);

    // Lazy loading: mostrar 5, luego todos
    const visibleProducts = useMemo(() => {
        if (!report?.all_products) return [];
        return showAllProducts ? report.all_products : report.all_products.slice(0, 5);
    }, [report, showAllProducts]);

    const handleExportCSV = () => {
        if (!report) return;
        const rows = [
            ["Producto", "Unidades", "Facturación ($)", "Ticket Unitario ($)", "% del Total"],
            ...report.all_products.map((p: any) => [
                p.name, p.quantity, p.revenue.toFixed(2), p.unit_ticket.toFixed(2), `${p.pct_of_total}%`
            ]),
            [],
            [`Período: ${period}`, `Total: $${report.kpis.revenue}`, `Pedidos: ${report.kpis.orders}`],
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Reporte_${period}_${format(new Date(), "dd-MM-yyyy")}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Reporte exportado");
    };

    if (error) return <div className="text-red-400 p-8">Error cargando reportes.</div>;

    return (
        <div className="p-6 lg:p-8 pb-32 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reportes</h1>
                    <p className="text-zinc-400 mt-1">Análisis de rendimiento del negocio</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Period selector */}
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-0.5">
                        {PERIODS.map(p => (
                            <button
                                key={p.key}
                                onClick={() => { setPeriod(p.key); setShowAllProducts(false); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p.key
                                    ? "bg-yellow-600 text-white shadow-lg shadow-yellow-900/30"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExportCSV}
                        disabled={!report}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" /> CSV
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                </div>
            ) : report && (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <KpiCard icon={<DollarSign className="w-5 h-5 text-yellow-500" />} title="Facturación" value={`$${new Intl.NumberFormat('es-AR').format(report.kpis.revenue)}`} sub={`Período: ${PERIODS.find(p => p.key === period)?.label}`} />
                        <KpiCard icon={<ShoppingBag className="w-5 h-5 text-yellow-500" />} title="Pedidos" value={report.kpis.orders} sub={`${report.kpis.orders_per_day}/día promedio`} />
                        <KpiCard icon={<TrendingUp className="w-5 h-5 text-yellow-500" />} title="Ticket Promedio" value={`$${new Intl.NumberFormat('es-AR').format(report.kpis.avg_ticket)}`} sub="Por pedido" />
                        <KpiCard icon={<CalendarDays className="w-5 h-5 text-yellow-500" />} title="Granularidad" value={report.granularity === "daily" ? "Diaria" : "Mensual"} sub={`${report.revenue_timeline.length} puntos`} />
                    </div>

                    {/* Gráfico principal: Facturación Timeline */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                        <div className="lg:col-span-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <BarChart3 className="w-4 h-4 text-yellow-500" />
                                <h2 className="text-lg font-bold text-white">Facturación {report.granularity === "daily" ? "Diaria" : "Mensual"}</h2>
                            </div>
                            <p className="text-zinc-500 text-xs mb-6">{report.revenue_timeline.length} {report.granularity === "daily" ? "días" : "meses"} con datos</p>

                            {report.revenue_timeline.length === 0 ? (
                                <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
                                    No hay datos para este período.
                                </div>
                            ) : (
                                <div className="flex items-end gap-[2px] h-52">
                                    {report.revenue_timeline.map((d: any, i: number) => {
                                        const pct = (d.revenue / timelineMax) * 100;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center justify-end group relative" style={{ height: '100%' }}>
                                                {/* Tooltip */}
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                    <p className="font-bold">{d.label}</p>
                                                    <p>${new Intl.NumberFormat('es-AR').format(d.revenue)} · {d.orders} ped.</p>
                                                </div>
                                                <div
                                                    className="w-full rounded-t-sm bg-gradient-to-t from-yellow-600 to-yellow-400 group-hover:from-yellow-500 group-hover:to-yellow-300 transition-all"
                                                    style={{ height: `${Math.max(pct, 3)}%`, minHeight: '2px' }}
                                                />
                                                {/* Labels cada N barras */}
                                                {(report.revenue_timeline.length <= 15 || i % Math.ceil(report.revenue_timeline.length / 10) === 0) && (
                                                    <span className="text-[8px] text-zinc-600 mt-1 truncate max-w-full">{d.label}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Top Productos */}
                        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4">Top Productos</h2>
                            {report.top_products.length === 0 ? (
                                <p className="text-zinc-600 text-sm">Sin datos.</p>
                            ) : (
                                <div className="space-y-3">
                                    {report.top_products.slice(0, 5).map((p: any, i: number) => (
                                        <div key={p.name} className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-zinc-700/50 text-zinc-300' : 'bg-zinc-800/50 text-zinc-500'}`}>
                                                #{i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                                                <p className="text-xs text-zinc-500">{p.quantity} uds · {p.pct_of_total}% del total</p>
                                            </div>
                                            <span className="text-yellow-400 font-semibold text-sm flex-shrink-0">
                                                ${new Intl.NumberFormat('es-AR').format(p.revenue)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fila 3: Día de semana + Método de pago */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Ventas por día de la semana */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-1">Ventas por Día</h2>
                            <p className="text-zinc-500 text-xs mb-5">Facturación promedio por día de la semana</p>
                            {report.by_weekday.length === 0 ? (
                                <p className="text-zinc-600 text-sm">Sin datos.</p>
                            ) : (
                                <div className="space-y-3">
                                    {report.by_weekday.map((d: any) => {
                                        const pct = (d.avg_revenue / weekdayMax) * 100;
                                        return (
                                            <div key={d.day} className="flex items-center gap-3">
                                                <span className="w-12 text-xs text-zinc-400 font-medium flex-shrink-0">{d.day.slice(0, 3)}</span>
                                                <div className="flex-1 bg-zinc-800/50 rounded-full h-6 overflow-hidden relative">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.max(pct, 2)}%` }}
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-300 font-medium">
                                                        ${new Intl.NumberFormat('es-AR').format(d.avg_revenue)}/día
                                                    </span>
                                                </div>
                                                <span className="text-xs text-zinc-500 w-14 text-right flex-shrink-0">{d.total_orders} ped.</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Método de pago */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <CreditCard className="w-4 h-4 text-yellow-500" />
                                <h2 className="text-lg font-bold text-white">Métodos de Pago</h2>
                            </div>
                            <p className="text-zinc-500 text-xs mb-5">Distribución por método</p>
                            {report.by_payment_method.length === 0 ? (
                                <p className="text-zinc-600 text-sm">Sin datos.</p>
                            ) : (
                                <div className="space-y-4">
                                    {report.by_payment_method.map((pm: any) => {
                                        const pct = (pm.revenue / paymentMax) * 100;
                                        return (
                                            <div key={pm.method}>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-sm font-medium text-white">{pm.method}</span>
                                                    <span className="text-xs text-zinc-400">{pm.count} pedidos · {pm.pct}%</span>
                                                </div>
                                                <div className="bg-zinc-800/50 rounded-full h-5 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.max(pct, 2)}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-1">${new Intl.NumberFormat('es-AR').format(pm.revenue)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabla de productos con lazy loading */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Performance de Productos</h2>
                        {report.all_products.length === 0 ? (
                            <p className="text-zinc-600 text-sm">Sin datos para este período.</p>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-zinc-800 text-zinc-400 text-xs">
                                                <th className="text-left pb-3 font-medium">Producto</th>
                                                <th className="text-right pb-3 font-medium">Unidades</th>
                                                <th className="text-right pb-3 font-medium">Facturación</th>
                                                <th className="text-right pb-3 font-medium">Ticket Unit.</th>
                                                <th className="text-right pb-3 font-medium">% Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visibleProducts.map((p: any, i: number) => (
                                                <tr key={p.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                                    <td className="py-3 text-white font-medium">{p.name}</td>
                                                    <td className="py-3 text-right text-zinc-300">{p.quantity}</td>
                                                    <td className="py-3 text-right text-yellow-400 font-semibold">${new Intl.NumberFormat('es-AR').format(p.revenue)}</td>
                                                    <td className="py-3 text-right text-zinc-400">${new Intl.NumberFormat('es-AR').format(p.unit_ticket)}</td>
                                                    <td className="py-3 text-right">
                                                        <span className="bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold">
                                                            {p.pct_of_total}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {!showAllProducts && report.all_products.length > 5 && (
                                    <button
                                        onClick={() => setShowAllProducts(true)}
                                        className="mt-4 w-full py-2.5 text-sm font-medium text-yellow-400 hover:text-yellow-300 bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/20 rounded-xl transition-all"
                                    >
                                        Ver todos los productos ({report.all_products.length})
                                    </button>
                                )}
                                {showAllProducts && report.all_products.length > 5 && (
                                    <button
                                        onClick={() => setShowAllProducts(false)}
                                        className="mt-4 w-full py-2.5 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl transition-all"
                                    >
                                        Mostrar menos
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function KpiCard({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: string | number; sub: string }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center mb-3">
                {icon}
            </div>
            <h4 className="text-zinc-400 text-xs font-medium">{title}</h4>
            <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
            <p className="text-zinc-500 text-xs mt-1">{sub}</p>
        </div>
    );
}

