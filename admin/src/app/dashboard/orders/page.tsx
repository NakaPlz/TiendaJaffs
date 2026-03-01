"use client";

import useSWR from "swr";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Plus, Trash2, Clock, CheckCircle2, ChevronDown, MapPin, ReceiptText } from "lucide-react";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const fetcher = (url: string) => axios.get(url).then(res => res.data);

// Las fechas del backend están en hora Argentina (UTC-3) pero sin indicador de zona.
const parseArgDate = (d: string) => new Date(d.endsWith('-03:00') ? d : d + '-03:00');

// Types
interface OrderItem {
    id: number;
    quantity: number; // Changed from int to number
    unit_price: number;
    special_instructions?: string;
    product: { name: string; id: number };
}

interface Order {
    id: number;
    customer_name: string;
    order_type: "delivery" | "take_away";
    delivery_address?: string;
    delivery_references?: string;
    payment_method: string;
    total_amount: number;
    shipping_cost: number;
    status: string;
    created_at: string;
    items: OrderItem[];
}

export default function OrdersPage() {
    // auto-refresh activo para nuevos pedidos entrantes cada 5 seg.
    const { data: orders, error, mutate, isLoading } = useSWR<Order[]>(`${API_URL}/orders/`, fetcher, { refreshInterval: 5000 });
    const { data: products } = useSWR<any[]>(`${API_URL}/products/`, fetcher);
    const [isCreatingManual, setIsCreatingManual] = useState(false);
    const [manualCustomer, setManualCustomer] = useState("");
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        setUserRole(localStorage.getItem("jaffs_user_role"));
    }, []);

    // POS State
    const [manualItems, setManualItems] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState("1");
    const [specialInstructions, setSpecialInstructions] = useState("");

    const handleDeleteOrder = async (id: number) => {
        // Protección administrativa requerida por el usuario
        if (!confirm("Solo un administrador debería eliminar órdenes. ¿Continuar eliminación?")) return;
        try {
            await axios.delete(`${API_URL}/orders/${id}`);
            toast.success("Órden eliminada de los registros.");
            mutate();
        } catch {
            toast.error("Hubo un error al eliminarla.");
        }
    };

    const handleAddManualItem = () => {
        if (!selectedProductId || !products) return;
        const product = products.find(p => p.id.toString() === selectedProductId);
        if (!product) return;

        const newItem = {
            product_id: product.id,
            name: product.name,
            quantity: parseInt(selectedQuantity),
            unit_price: product.price,
            special_instructions: specialInstructions
        };

        setManualItems([...manualItems, newItem]);
        setSelectedProductId("");
        setSelectedQuantity("1");
        setSpecialInstructions("");
    };

    const handleRemoveManualItem = (index: number) => {
        const newItems = [...manualItems];
        newItems.splice(index, 1);
        setManualItems(newItems);
    };

    const manualTotalCalculated = manualItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const handleCreateManualOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualCustomer.trim() || manualItems.length === 0) return toast.error("Ingresa cliente y al menos 1 producto.");
        try {
            await axios.post(`${API_URL}/orders/`, {
                customer_name: manualCustomer + " (Local)",
                order_type: "take_away",
                payment_method: "efectivo",
                shipping_cost: 0,
                items: manualItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    special_instructions: item.special_instructions
                }))
            });
            toast.success("Venta de mostrador registrada.");
            setIsCreatingManual(false);
            setManualCustomer("");
            setManualItems([]);
            mutate();
        } catch {
            toast.error("Error al cargar la venta manual.");
        }
    };

    if (error) return <div className="text-red-400 p-8">Error de conexión al servidor DB.</div>;

    return (
        <div className="p-8 pb-32">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        Gestión de Órdenes
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-orange-500" />}
                    </h1>
                    <p className="text-zinc-400 mt-1">Órdenes que llegan por WhatsApp o que cargas en el mostrador.</p>
                </div>
                <button
                    onClick={() => setIsCreatingManual(!isCreatingManual)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Venta Manual
                </button>
            </div>

            {isCreatingManual && (
                <div className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl animate-in fade-in slide-in-from-top-4 space-y-6">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                        <h2 className="text-xl font-bold text-white">Venta en Mostrador</h2>
                        <button type="button" onClick={() => setIsCreatingManual(false)} className="text-zinc-500 hover:text-white transition-colors text-sm font-medium">Cerrar POS</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Selector de Items */}
                        <div className="space-y-4 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/80">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Buscar Producto</label>
                                <select
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {products?.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Cantidad</label>
                                    <input type="number" min="1" value={selectedQuantity} onChange={(e) => setSelectedQuantity(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-orange-500 outline-none" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Aclaraciones</label>
                                    <input value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="Ej. Sin mayonesa" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-orange-500 outline-none" />
                                </div>
                            </div>
                            <button type="button" onClick={handleAddManualItem} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-zinc-700">
                                Agregar al Pedido
                            </button>
                        </div>

                        {/* Ticket (Resumen) */}
                        <form onSubmit={handleCreateManualOrder} className="flex flex-col h-full space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Nombre en el Ticket</label>
                                <input required autoFocus value={manualCustomer} onChange={(e) => setManualCustomer(e.target.value)} placeholder="¿A qué nombre?" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-orange-500 outline-none" />
                            </div>

                            <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-y-auto max-h-48 border-dashed">
                                {manualItems.length === 0 ? (
                                    <p className="text-zinc-600 text-sm text-center py-8">Ticket vacío</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {manualItems.map((item, i) => (
                                            <li key={i} className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2">
                                                <div>
                                                    <span className="text-orange-500 font-bold mr-2">{item.quantity}x</span>
                                                    <span className="text-zinc-300">{item.name}</span>
                                                    {item.special_instructions && <p className="text-[10px] text-zinc-500">{item.special_instructions}</p>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-zinc-400 font-medium">${(item.quantity * item.unit_price).toFixed(2)}</span>
                                                    <button type="button" onClick={() => handleRemoveManualItem(i)} className="text-red-500 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="flex justify-between items-center bg-zinc-950 p-4 border border-zinc-800 rounded-xl">
                                <span className="text-lg text-zinc-400 font-medium">TOTAL:</span>
                                <span className="text-2xl text-white font-bold">${manualTotalCalculated.toFixed(2)}</span>
                            </div>

                            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white px-6 py-3.5 rounded-xl font-bold transition-colors text-sm uppercase tracking-wide">
                                Cobrar e Imprimir Ticket
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {!orders || orders.length === 0 && !isLoading ? (
                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
                    <ReceiptText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">No hay órdenes registradas</h3>
                    <p className="text-zinc-500 mt-1">Las compras realizadas aparecerán aquí en tiempo real.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {orders?.map(order => (
                        <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4 items-start">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${order.order_type === 'delivery' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        #{order.id.toString().padStart(3, '0')}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-tight">{order.customer_name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1 font-medium">
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {format(parseArgDate(order.created_at), "HH:mm", { locale: es })}</span>
                                            <span>•</span>
                                            <span className="uppercase tracking-wider text-[11px] font-bold text-zinc-500">{order.payment_method}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Actions Menu Placeholder */}
                                {userRole !== 'employee' && (
                                    <button onClick={() => handleDeleteOrder(order.id)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {order.order_type === 'delivery' && (
                                <div className="mb-4 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 flex gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-zinc-300">
                                        <p className="font-medium text-white">{order.delivery_address}</p>
                                        {order.delivery_references && <p className="text-zinc-500 mt-0.5 text-xs">{order.delivery_references}</p>}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 mb-4">
                                {order.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm py-1 border-b border-zinc-800/30 last:border-0 hover:bg-zinc-800/20 px-2 rounded -mx-2">
                                        <div className="flex gap-2">
                                            <span className="text-orange-500 font-semibold">{item.quantity}x</span>
                                            <span className="text-zinc-300">
                                                {item.product.name}
                                                {item.special_instructions && <span className="block text-xs text-orange-400">Nota: {item.special_instructions}</span>}
                                            </span>
                                        </div>
                                        <span className="text-zinc-400">${(item.quantity * item.unit_price).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                                <div className="bg-zinc-950 py-1.5 px-3 rounded-full border border-zinc-800 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-xs font-semibold text-zinc-300">RECIBIDO</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-zinc-500 mb-0.5">Total (inc. Envío)</p>
                                    <p className="text-xl font-bold text-white">${order.total_amount.toFixed(2)}</p>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
