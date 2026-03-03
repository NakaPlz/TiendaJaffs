"use client";

import { useCart, CartItem } from "@/context/CartContext";
import { ArrowLeft, Trash2, MapPin, Store, MessageCircle, ChevronRight, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, totalAmount, totalItems, clearCart } = useCart();
    const router = useRouter();

    const { data: storeSettings, isLoading: isLoadingSettings } = useSWR<any>(`${API_URL}/settings/`, fetcher);

    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('pickup');
    const [customerName, setCustomerName] = useState("");
    const [address, setAddress] = useState("");
    const [entreCalles, setEntreCalles] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
    const [isSending, setIsSending] = useState(false);

    // Costo de envío desde configuración del backend
    const costoEnvio = storeSettings?.delivery_cost ?? 1500;
    const isDelivery = orderType === 'delivery';
    const totalFinal = totalAmount + (isDelivery ? costoEnvio : 0);

    const handleWhatsAppCheckout = async () => {
        if (isLoadingSettings || !storeSettings) {
            alert("Aún estamos calculando un par de cosas, intenta en unos segundos.");
            return;
        }

        if (!customerName) {
            alert("Por favor, ingresa tu Nombre y Apellido");
            return;
        }
        if (isDelivery) {
            if (!address) {
                alert("Por favor, ingresa tu dirección para el envío");
                return;
            }
            if (!entreCalles) {
                alert("Por favor, ingresa entre qué calles te encuentras");
                return;
            }
        }

        setIsSending(true);

        try {
            // 1. Guardar la orden en la base de datos
            const orderPayload = {
                customer_name: customerName,
                order_type: isDelivery ? 'delivery' : 'take_away',
                delivery_address: isDelivery ? `${address} (entre ${entreCalles})` : null,
                delivery_references: isDelivery && observaciones ? observaciones : null,
                payment_method: metodoPago.toLowerCase(),
                shipping_cost: isDelivery ? costoEnvio : 0,
                items: items.map((item: CartItem) => ({
                    product_id: item.id,
                    quantity: item.quantity,
                })),
            };

            const response = await axios.post(`${API_URL}/orders/`, orderPayload);
            const savedOrder = response.data;

            // 2. Generar mensaje de WhatsApp con el número de orden real
            const orderDetails = items.map(
                (item: CartItem) => `- ${item.quantity} x ${item.name} ($${new Intl.NumberFormat('es-AR').format(item.price * item.quantity)})`
            ).join("\n");

            let message = `Hola! Soy *${customerName}*. Quiero hacer un pedido para *${isDelivery ? 'Delivery' : 'Take Away'}*\n\n`;

            if (isDelivery) {
                message += `Entregar en *${address}*\n`;
                if (entreCalles) message += `Entre calles *${entreCalles}*\n`;
                if (observaciones) message += `Observaciones: *${observaciones}*\n`;
                message += `\n`;
            }

            message += `Mi pedido:\n${orderDetails}\n\n`;
            message += `Subtotal del pedido: $${new Intl.NumberFormat('es-AR').format(totalAmount)}\n`;
            if (isDelivery) {
                message += `Costo envio: $${new Intl.NumberFormat('es-AR').format(costoEnvio)}\n`;
            }
            message += `*Total pedido: $${new Intl.NumberFormat('es-AR').format(totalFinal)}*\n\n`;
            message += `Forma de pago: *${metodoPago}*\n\n`;
            message += `Pedido: #${savedOrder.id}\n`;
            message += `Muchas gracias!!`;

            const destinationNumber = storeSettings.whatsapp_number;
            const whatsappUrl = `https://wa.me/${destinationNumber}?text=${encodeURIComponent(message)}`;

            // 3. Limpiar carrito y redirigir
            clearCart();
            window.open(whatsappUrl, '_blank');
            router.push("/");
        } catch (error) {
            console.error("Error al crear la orden:", error);
            alert("Hubo un error al procesar tu pedido. Intentá de nuevo.");
        } finally {
            setIsSending(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="bg-zinc-950 min-h-screen text-white max-w-md lg:max-w-2xl mx-auto border-x border-zinc-900 shadow-xl flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                    <Trash2 className="w-10 h-10 text-zinc-700" />
                </div>
                <h2 className="text-xl font-bold mb-2">Tu pedido está vacío</h2>
                <p className="text-zinc-500 mb-8">Parece que aún no has agregado nada delicioso a tu pedido.</p>
                <Link href="/" className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-yellow-900/40">
                    Ir al Menú
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-zinc-950 min-h-screen text-white max-w-md lg:max-w-5xl mx-auto relative border-x border-zinc-900 shadow-2xl pb-64 lg:pb-12">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-4 lg:px-8 py-4 flex items-center gap-4">
                <Link href="/" className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg flex-1 font-bold">Tu Pedido <span className="text-zinc-500 font-normal">({totalItems})</span></h1>
            </header>

            {/* Desktop: dos columnas — Items a la izquierda + Formulario a la derecha */}
            <div className="lg:flex lg:gap-8 lg:px-8 lg:py-6">
                {/* Columna izquierda: Items del carrito */}
                <div className="lg:flex-1">
                    <motion.div layout className="px-4 py-6 lg:px-0 lg:py-0 space-y-4">
                        <AnimatePresence mode="popLayout">
                            {items.map((item: CartItem) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    key={item.id}
                                    className="bg-zinc-900/40 p-4 rounded-[2rem] border border-zinc-800 flex gap-4"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[15px]">{item.name}</h3>
                                        <p className="text-yellow-500 font-extrabold mt-1">
                                            ${new Intl.NumberFormat('es-AR').format(item.price)}
                                        </p>

                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 rounded-lg active:scale-95 transition-transform"
                                                >-</button>
                                                <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 rounded-lg active:scale-95 transition-transform"
                                                >+</button>
                                            </div>

                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="p-2.5 text-zinc-500 hover:text-red-400 bg-zinc-950 border border-zinc-800 hover:border-red-500/30 rounded-xl transition-colors ml-auto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {/* Resumen del pedido — visible solo en desktop dentro del flow */}
                    <div className="hidden lg:block mt-6 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5">
                        <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wide mb-3">Resumen</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-zinc-400">
                                <span>Subtotal ({totalItems} items)</span>
                                <span className="text-zinc-200">${new Intl.NumberFormat('es-AR').format(totalAmount)}</span>
                            </div>
                            {isDelivery && (
                                <div className="flex justify-between text-zinc-400">
                                    <span>Costo de envío</span>
                                    <span className="text-zinc-200">${new Intl.NumberFormat('es-AR').format(costoEnvio)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-3 border-t border-zinc-800 text-white font-bold text-lg">
                                <span>Total</span>
                                <span className="text-yellow-500">${new Intl.NumberFormat('es-AR').format(totalFinal)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna derecha: Formulario de checkout */}
                <div className="lg:w-96 lg:flex-shrink-0">
                    <div className="px-4 py-2 lg:px-0 lg:py-0 space-y-4">
                        <h2 className="text-lg font-bold">Datos de entrega</h2>

                        <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <button
                                onClick={() => setOrderType('pickup')}
                                className={`py-3 flex items-center justify-center gap-2 rounded-xl transition-all font-semibold text-sm ${orderType === 'pickup' ? 'bg-yellow-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                            >
                                <Store className="w-4 h-4" /> Retiro Local
                            </button>
                            <button
                                onClick={() => setOrderType('delivery')}
                                className={`py-3 flex items-center justify-center gap-2 rounded-xl transition-all font-semibold text-sm ${orderType === 'delivery' ? 'bg-yellow-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                            >
                                <MapPin className="w-4 h-4" /> A Domicilio
                            </button>
                        </div>

                        <div className="space-y-3 mt-4">
                            <input
                                type="text"
                                placeholder="Nombre y Apellido"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50"
                            />

                            {isDelivery && (
                                <div className="space-y-3 animate-in fade-in zoom-in-95">
                                    <input
                                        type="text"
                                        placeholder="Dirección de entrega"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Entre calles"
                                        value={entreCalles}
                                        onChange={(e) => setEntreCalles(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Observaciones / Referencias de la casa (Opcional)"
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50"
                                    />
                                </div>
                            )}

                            <h3 className="font-bold text-sm text-zinc-400 pt-3 mb-2 uppercase tracking-wide">Método de Pago</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setMetodoPago('EFECTIVO')}
                                    className={`py-3 rounded-xl transition-all font-semibold text-sm border ${metodoPago === 'EFECTIVO'
                                        ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                                        : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                        }`}
                                >
                                    Efectivo
                                </button>
                                <button
                                    onClick={() => setMetodoPago('TRANSFERENCIA')}
                                    className={`py-3 rounded-xl transition-all font-semibold text-sm border ${metodoPago === 'TRANSFERENCIA'
                                        ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                                        : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                        }`}
                                >
                                    Transferencia
                                </button>
                            </div>
                        </div>

                        {/* Desktop: botón de checkout inline */}
                        <div className="hidden lg:block pt-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400 font-medium">Total a pagar</span>
                                <span className="text-2xl font-black text-white">${new Intl.NumberFormat('es-AR').format(totalFinal)}</span>
                            </div>
                            <button
                                onClick={handleWhatsAppCheckout}
                                disabled={isLoadingSettings || isSending}
                                className="w-full bg-[#25D366] hover:bg-[#1DA851] disabled:opacity-50 disabled:grayscale text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.98]"
                            >
                                <MessageCircle className="w-5 h-5" />
                                {isSending ? "Procesando pedido..." : isLoadingSettings ? "Cargando conectividad..." : "Enviar Pedido por WhatsApp"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Final Checkout Bar — solo mobile */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 p-6 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900 max-w-md mx-auto">
                <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500">Subtotal</span>
                        <span className="text-zinc-300">${new Intl.NumberFormat('es-AR').format(totalAmount)}</span>
                    </div>
                    {isDelivery && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500">Costo de envío</span>
                            <span className="text-zinc-300">${new Intl.NumberFormat('es-AR').format(costoEnvio)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-1.5 border-t border-zinc-800">
                        <span className="text-zinc-400 font-medium">Total a pagar</span>
                        <span className="text-2xl font-black text-white">${new Intl.NumberFormat('es-AR').format(totalFinal)}</span>
                    </div>
                </div>
                <button
                    onClick={handleWhatsAppCheckout}
                    disabled={isLoadingSettings || isSending}
                    className="w-full bg-[#25D366] hover:bg-[#1DA851] disabled:opacity-50 disabled:grayscale text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.98]"
                >
                    <MessageCircle className="w-5 h-5" />
                    {isSending ? "Procesando pedido..." : isLoadingSettings ? "Cargando conectividad..." : "Enviar Pedido por WhatsApp"}
                </button>
            </div>
        </div>
    );
}

