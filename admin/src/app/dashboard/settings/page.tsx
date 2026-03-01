"use client";

import { useState, useEffect } from "react";
import { Store, Phone, Truck, ShieldAlert, Save, Loader2, Plus, Trash2, CalendarClock } from "lucide-react";
import toast from "react-hot-toast";
import useSWR from "swr";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const fetcher = (url: string) => axios.get(url).then(res => res.data);

type TimeSlot = { open: string, close: string };
type DaySchedule = {
    enabled: boolean;
    slots: TimeSlot[];
};

type ScheduleMap = {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
};

const daysOfWeek: { key: keyof ScheduleMap, label: string }[] = [
    { key: "monday", label: "Lunes" },
    { key: "tuesday", label: "Martes" },
    { key: "wednesday", label: "Miércoles" },
    { key: "thursday", label: "Jueves" },
    { key: "friday", label: "Viernes" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
];

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState({
        isOpen: true,
        autoSchedule: true,
        schedules: {
            monday: { enabled: true, slots: [{ open: "12:00", close: "15:00" }, { open: "19:30", close: "23:30" }] },
            tuesday: { enabled: true, slots: [{ open: "12:00", close: "15:00" }, { open: "19:30", close: "23:30" }] },
            wednesday: { enabled: true, slots: [{ open: "12:00", close: "15:00" }, { open: "19:30", close: "23:30" }] },
            thursday: { enabled: true, slots: [{ open: "12:00", close: "15:00" }, { open: "19:30", close: "23:30" }] },
            friday: { enabled: true, slots: [{ open: "12:00", close: "15:00" }, { open: "19:30", close: "23:30" }] },
            saturday: { enabled: true, slots: [{ open: "12:00", close: "15:00" }, { open: "19:30", close: "23:30" }] },
            sunday: { enabled: true, slots: [{ open: "19:00", close: "23:59" }] }
        } as ScheduleMap,
        whatsappNumber: "5491112345678",
        deliveryCost: "500",
        orderMessage: "¡Hola! Quisiera hacer el siguiente pedido:"
    });

    const { data: dbSettings, mutate: mutateSettings } = useSWR(`${API_URL}/settings/`, fetcher);

    // Fusionamos la config de la DB al estado local
    useEffect(() => {
        if (!dbSettings) return;

        setSettings(prev => ({
            ...prev,
            isOpen: dbSettings.is_open,
            whatsappNumber: dbSettings.whatsapp_number,
            deliveryCost: dbSettings.delivery_cost.toString(),
            orderMessage: dbSettings.order_message,
            ...(dbSettings.schedules && { schedules: dbSettings.schedules })
        }));
    }, [dbSettings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Guardar toda la configuración en el backend (incluyendo horarios)
            await axios.put(`${API_URL}/settings/`, {
                is_open: settings.isOpen,
                whatsapp_number: settings.whatsappNumber,
                delivery_cost: parseFloat(settings.deliveryCost),
                order_message: settings.orderMessage,
                schedules: settings.schedules
            });

            mutateSettings(); // Actualizar cache de SWR
            toast.success("Configuración actualizada correctamente");
        } catch (err) {
            console.error(err);
            toast.error("Error al guardar ajustes.");
        } finally {
            setIsLoading(false);
        }
    };

    const addSlot = (dayKey: keyof ScheduleMap) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            if (!newSettings.schedules[dayKey]) return newSettings;
            newSettings.schedules[dayKey].slots.push({ open: "00:00", close: "00:00" });
            return newSettings;
        });
    };

    const removeSlot = (dayKey: keyof ScheduleMap, index: number) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            if (!newSettings.schedules[dayKey]) return newSettings;
            newSettings.schedules[dayKey].slots.splice(index, 1);
            return newSettings;
        });
    };

    const updateSlot = (dayKey: keyof ScheduleMap, index: number, field: 'open' | 'close', value: string) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            if (!newSettings.schedules[dayKey]) return newSettings;
            newSettings.schedules[dayKey].slots[index][field] = value;
            return newSettings;
        });
    };

    const toggleDay = (dayKey: keyof ScheduleMap, enabled: boolean) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            // Auto inicializar vacio si un viejo localStorage no lo traía para evitar breaks de React
            if (!newSettings.schedules[dayKey]) {
                newSettings.schedules[dayKey] = { enabled: true, slots: [] };
            }
            newSettings.schedules[dayKey].enabled = enabled;
            return newSettings;
        });
    };

    return (
        <div className="p-8 pb-32 max-w-4xl mx-auto w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Configuración</h1>
                <p className="text-zinc-400 mt-1">Ajustes operativos y parámetros de envío.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* Estado Operativo */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Store className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Estado del Local</h2>
                            <p className="text-zinc-500 text-sm">Controla si los clientes pueden hacer pedidos en la web.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Switch Apertura Manual */}
                        <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                            <div className={settings.autoSchedule ? 'opacity-50' : ''}>
                                <p className="font-medium text-white">Forzar Cierre (Manual)</p>
                                <p className="text-xs text-zinc-500 mt-1 pl-0.5">Pausar todas las compras de la carta inmediatamente.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!settings.isOpen}
                                    onChange={(e) => setSettings({ ...settings, isOpen: !e.target.checked })}
                                    disabled={settings.autoSchedule}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-disabled:cursor-not-allowed peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                            </label>
                        </div>

                        {/* Switch Horario Automático */}
                        <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.05)]">
                            <div>
                                <p className="font-medium text-orange-400">Automatizar Horarios de Atención</p>
                                <p className="text-xs text-zinc-400 mt-1 pl-0.5">La tienda abrirá y cerrará sola según las horas configuradas abajo.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.autoSchedule}
                                    onChange={(e) => setSettings({ ...settings, autoSchedule: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Parámetros Comerciales */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Phone className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Configuración del Servicio</h2>
                            <p className="text-zinc-500 text-sm">Horarios, Contacto y Costos de Envío.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Horarios Dinámicos */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-zinc-400 mb-4">Horarios de Atención (Apertura y Cierre)</label>
                            <div className="space-y-4">

                                {/* Iteramos los 7 días de Lunes a Domingo */}
                                {daysOfWeek.map(({ key, label }) => {
                                    const schedule = settings.schedules?.[key] || { enabled: false, slots: [] };

                                    return (
                                        <div key={key} className={`p-4 rounded-xl border transition-colors ${schedule.enabled ? 'bg-zinc-950 border-zinc-800' : 'bg-black border-zinc-900 opacity-60'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <CalendarClock className="w-4 h-4 text-orange-500" />
                                                    <span className="font-medium text-white">{label}</span>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={schedule.enabled} onChange={(e) => toggleDay(key, e.target.checked)} className="sr-only peer" />
                                                    <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                                                </label>
                                            </div>

                                            {schedule.enabled && (
                                                <div className="space-y-3">
                                                    {schedule.slots.map((slot, idx) => (
                                                        <div key={idx} className="flex items-center gap-3">
                                                            <input type="time" value={slot.open} onChange={(e) => updateSlot(key, idx, 'open', e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-orange-500 outline-none" />
                                                            <span className="text-zinc-500">a</span>
                                                            <input type="time" value={slot.close} onChange={(e) => updateSlot(key, idx, 'close', e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-orange-500 outline-none" />
                                                            {schedule.slots.length > 1 && (
                                                                <button type="button" onClick={() => removeSlot(key, idx)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => addSlot(key)} className="text-sm font-medium text-orange-500 hover:text-orange-400 flex items-center gap-1 mt-2">
                                                        <Plus className="w-4 h-4" /> Añadir otro turno
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                            </div>
                        </div>

                        {/* Contacto Y WhatsApp */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">WhatsApp Recepción</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <span className="text-zinc-500">+</span>
                                </div>
                                <input
                                    type="text"
                                    value={settings.whatsappNumber}
                                    onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    placeholder="549110000000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Costo de Envío Estándar</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <span className="text-zinc-500">$</span>
                                </div>
                                <input
                                    type="number"
                                    value={settings.deliveryCost}
                                    onChange={(e) => setSettings({ ...settings, deliveryCost: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    placeholder="500"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 mt-4 pt-6 border-t border-zinc-800/50">
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Mensaje Predefinido de WhatsApp</label>
                            <textarea
                                rows={2}
                                value={settings.orderMessage}
                                onChange={(e) => setSettings({ ...settings, orderMessage: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                placeholder="¡Hola! Te dejo mi pedido:"
                            />
                        </div>
                    </div>
                </div>

                {/* Seguridad (Informativo) */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-zinc-300">Seguridad del Panel</h3>
                            <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                                La contraseña global de administración y configuraciones de base de datos se manejan exclusivamente a través de variables de entorno (<code className="bg-zinc-800 px-1 py-0.5 rounded text-xs">.env.local</code>) para garantizar la máxima seguridad contra ataques.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-orange-900/20 active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
}
