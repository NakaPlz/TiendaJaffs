"use client";

import { DollarSign, TrendingUp, CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import axios from "axios";
import { isToday, isYesterday } from "date-fns";
import { useMemo } from "react";

// Las fechas del backend están en hora Argentina (UTC-3) pero sin indicador de zona.
const parseArgDate = (d: string) => new Date(d.endsWith('-03:00') ? d : d + '-03:00');

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function DashboardPage() {

    const { data: orders } = useSWR(`${API_URL}/orders/`, fetcher);
    const { data: products } = useSWR(`${API_URL}/products/`, fetcher);

    // --- Cálculos de métricas ---
    const todaysOrders = orders?.filter((o: any) => isToday(parseArgDate(o.created_at))) || [];
    const yesterdaysOrders = orders?.filter((o: any) => isYesterday(parseArgDate(o.created_at))) || [];

    const totalRevenueToday = todaysOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0);
    const totalRevenueYesterday = yesterdaysOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0);
    const revenueChange = totalRevenueYesterday > 0
        ? (((totalRevenueToday - totalRevenueYesterday) / totalRevenueYesterday) * 100)
        : todaysOrders.length > 0 ? 100 : 0;

    const ticketPromedio = todaysOrders.length > 0
        ? totalRevenueToday / todaysOrders.length : 0;

    const totalHistorico = orders?.reduce((sum: number, o: any) => sum + o.total_amount, 0) || 0;

    // --- Gráfico de barras: ventas por hora del día ---
    const hourlyData = useMemo(() => {
        const hours: { hour: string; amount: number; count: number }[] = [];
        for (let h = 0; h < 24; h++) {
            hours.push({ hour: `${h.toString().padStart(2, '0')}`, amount: 0, count: 0 });
        }
        todaysOrders.forEach((o: any) => {
            const date = parseArgDate(o.created_at);
            const h = date.getHours();
            hours[h].amount += o.total_amount;
            hours[h].count += 1;
        });
        return hours;
    }, [todaysOrders]);

    const maxAmount = useMemo(() => Math.max(...hourlyData.map(h => h.amount), 1), [hourlyData]);

    // --- Platos más vendidos ---
    const topProducts = useMemo(() => {
        if (!orders) return [];
        const countMap: Record<string, { name: string; count: number; image_url?: string }> = {};
        orders.forEach((o: any) => {
            o.items?.forEach((item: any) => {
                const name = item.product?.name || `Producto ${item.product_id}`;
                if (!countMap[name]) {
                    countMap[name] = { name, count: 0, image_url: item.product?.image_url };
                }
                countMap[name].count += item.quantity;
            });
        });
        return Object.values(countMap).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [orders]);

    return (
        <div className="min-h-screen bg-zinc-950 p-8 text-white">
            <header className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inicio Rápido</h1>
                    <p className="text-zinc-400 mt-1">
                        Resumen de actividad y gestión de Jaff&apos;s Lomos
                    </p>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Facturación del Día */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-orange-500" />
                        </div>
                        {revenueChange !== 0 && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${revenueChange > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {revenueChange > 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                            </span>
                        )}
                    </div>
                    <h3 className="text-zinc-400 text-sm font-medium">Facturación del Día</h3>
                    <p className="text-3xl font-bold mt-1">${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(totalRevenueToday)}</p>
                    <p className="text-zinc-500 text-xs mt-1">{todaysOrders.length} operaciones</p>
                </div>

                {/* Ticket Promedio */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mb-2">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                    </div>
                    <h3 className="text-zinc-400 text-sm font-medium">Ticket Promedio</h3>
                    <p className="text-3xl font-bold mt-1">${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(ticketPromedio)}</p>
                    <p className="text-zinc-500 text-xs mt-1">Gasto por orden hoy</p>
                </div>

                {/* Facturación Histórica */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mb-2">
                        <CalendarDays className="w-5 h-5 text-orange-500" />
                    </div>
                    <h3 className="text-zinc-400 text-sm font-medium">Facturación Histórica</h3>
                    <p className="text-3xl font-bold mt-1">${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(totalHistorico)}</p>
                    <p className="text-zinc-500 text-xs mt-1">Desde el inicio ({orders?.length || 0} op.)</p>
                </div>
            </div>

            {/* Actividad Reciente + Platos más vendidos */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Actividad Reciente — Gráfico de barras por hora */}
                <div className="lg:col-span-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-1">Actividad Reciente</h2>
                    <p className="text-zinc-500 text-xs mb-6">Ventas por hora — {todaysOrders.length} pedidos hoy</p>

                    {todaysOrders.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
                            No hay pedidos registrados hoy. El gráfico se llenará con la actividad del día.
                        </div>
                    ) : (
                        <div className="flex items-end gap-[3px] h-48">
                            {hourlyData.map((h) => {
                                const heightPercent = (h.amount / maxAmount) * 100;
                                const hasData = h.amount > 0;
                                return (
                                    <div
                                        key={h.hour}
                                        className="flex-1 flex flex-col items-center justify-end group relative"
                                        style={{ height: '100%' }}
                                    >
                                        {/* Tooltip */}
                                        {hasData && (
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                {h.count} ped. — ${new Intl.NumberFormat('es-AR').format(h.amount)}
                                            </div>
                                        )}
                                        {/* Barra */}
                                        <div
                                            className={`w-full rounded-t-sm transition-all duration-300 ${hasData
                                                ? 'bg-gradient-to-t from-orange-600 to-orange-400 group-hover:from-orange-500 group-hover:to-orange-300'
                                                : 'bg-zinc-800'
                                                }`}
                                            style={{
                                                height: hasData ? `${Math.max(heightPercent, 4)}%` : '4%',
                                                minHeight: '2px'
                                            }}
                                        />
                                        {/* Label de hora (solo hay espacio para algunas) */}
                                        {parseInt(h.hour) % 3 === 0 && (
                                            <span className="text-[9px] text-zinc-600 mt-1">{h.hour}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Platos más vendidos */}
                <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4">Platos más vendidos</h2>
                    {topProducts.length === 0 ? (
                        <p className="text-zinc-600 text-sm">Aún no hay datos suficientes.</p>
                    ) : (
                        <div className="space-y-4">
                            {topProducts.map((p, i) => (
                                <div key={p.name} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-orange-500/20 text-orange-400' :
                                        i === 1 ? 'bg-zinc-700/50 text-zinc-300' :
                                            'bg-zinc-800/50 text-zinc-500'
                                        }`}>
                                        #{i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                                        <p className="text-xs text-zinc-500">{p.count} unidades vendidas</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
