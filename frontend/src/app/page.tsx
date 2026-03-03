"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import axios from "axios";
import { Search, ShoppingBag, MapPin, Clock, Plus, Loader2, Instagram } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const fetcher = (url: string) => axios.get(url).then(res => res.data);

const DAYS_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function useStoreStatus(settings: any) {
  return useMemo(() => {
    if (!settings?.schedules) return { isOpen: false, statusText: "Cargando...", nextTimeText: "" };

    const now = new Date();
    const currentDay = DAYS_MAP[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const schedule = settings.schedules[currentDay];

    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const formatTime = (t: string) => {
      const [h, m] = t.split(":");
      return `${h}:${m}`;
    };

    // Verificar si estamos dentro de algún slot del día actual
    if (schedule?.enabled && schedule.slots?.length > 0) {
      for (const slot of schedule.slots) {
        const open = timeToMinutes(slot.open);
        const close = timeToMinutes(slot.close);
        if (currentMinutes >= open && currentMinutes < close) {
          return {
            isOpen: true,
            statusText: `Abierto hasta las ${formatTime(slot.close)}`,
            nextTimeText: "Tomando Pedidos"
          };
        }
      }

      // No estamos en ningún slot, buscar el próximo slot del día
      for (const slot of schedule.slots) {
        const open = timeToMinutes(slot.open);
        if (currentMinutes < open) {
          return {
            isOpen: false,
            statusText: `Abrimos a las ${formatTime(slot.open)}`,
            nextTimeText: "Cerrado"
          };
        }
      }
    }

    // Buscar el próximo día con slots habilitados
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (now.getDay() + i) % 7;
      const nextDayKey = DAYS_MAP[nextDayIndex];
      const nextSchedule = settings.schedules[nextDayKey];
      if (nextSchedule?.enabled && nextSchedule.slots?.length > 0) {
        const dayLabels: Record<string, string> = {
          monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
          thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo"
        };
        const nextOpen = nextSchedule.slots[0].open;
        const dayLabel = i === 1 ? "Mañana" : dayLabels[nextDayKey];
        return {
          isOpen: false,
          statusText: `Abrimos ${dayLabel} a las ${formatTime(nextOpen)}`,
          nextTimeText: "Cerrado"
        };
      }
    }

    return { isOpen: false, statusText: "Horario no disponible", nextTimeText: "Cerrado" };
  }, [settings]);
}

export default function Home() {
  const { data: categories, isLoading: isCategoriesLoading } = useSWR<any[]>(`${API_URL}/categories/`, fetcher);
  const { data: products, isLoading: isProductsLoading } = useSWR<any[]>(`${API_URL}/products/`, fetcher);
  const { data: storeSettings } = useSWR<any>(`${API_URL}/settings/`, fetcher);

  const { isOpen, statusText, nextTimeText } = useStoreStatus(storeSettings);

  // Conectar Carrito
  const { addToCart, totalItems, totalAmount } = useCart();

  const [activeCategory, setActiveCategory] = useState<number | string>('all');
  const [searchQuery, setSearchQuery] = useState("");

  // Tags que existen en al menos un producto
  const TAG_LABELS: Record<string, { label: string; emoji: string }> = {
    recomendados: { label: "Recomendados", emoji: "⭐" },
    ofertas: { label: "Ofertas", emoji: "🔥" },
    nuevo: { label: "Nuevo", emoji: "✨" },
    popular: { label: "Popular", emoji: "💎" },
  };

  const activeTags = useMemo(() => {
    if (!products) return [];
    const tagSet = new Set<string>();
    products.forEach(p => p.tags?.forEach((t: string) => tagSet.add(t)));
    return Array.from(tagSet).filter(t => TAG_LABELS[t]);
  }, [products]);

  // Calcular productos filtrados
  const filteredProducts = products?.filter(p => {
    const isTagFilter = typeof activeCategory === 'string' && activeCategory.startsWith('tag:');
    const matchesCategory = activeCategory === 'all'
      || (isTagFilter ? p.tags?.includes(activeCategory.replace('tag:', '')) : p.category_id === activeCategory);
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }) || [];

  return (
    <div className="pb-24 max-w-md lg:max-w-6xl mx-auto relative bg-zinc-950 min-h-screen border-x border-zinc-900 shadow-2xl">
      {/* Header Hero Area */}
      <header className="relative px-6 lg:px-10 pt-12 pb-8 overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-zinc-900 to-zinc-950 border-b border-zinc-800">
        {storeSettings?.banner_url ? (
          <>
            <img src={storeSettings.banner_url.startsWith('/') ? `${API_URL}${storeSettings.banner_url}` : storeSettings.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 to-zinc-950/95" />
          </>
        ) : (
          <div className="absolute top-0 inset-x-0 h-40 bg-yellow-500/20 blur-[100px] pointer-events-none" />
        )}

        <div className="relative z-10 flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            {storeSettings?.logo_url && (
              <img src={storeSettings.logo_url.startsWith('/') ? `${API_URL}${storeSettings.logo_url}` : storeSettings.logo_url} alt="Logo" className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
            )}
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                {storeSettings?.store_name || "Jaff\u0027s Lomos"}
              </h1>
              <p className="text-yellow-500 font-medium text-sm mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {storeSettings?.store_location || "Los Polvorines, Buenos Aires"}
              </p>
              {storeSettings?.store_description && (
                <p className="text-zinc-400 text-sm mt-1">{storeSettings.store_description}</p>
              )}
            </div>
          </div>
          {/* Desktop: mostrar carrito mini en el header */}
          {totalItems > 0 && (
            <Link href="/cart" className="hidden lg:flex items-center gap-3 bg-white text-zinc-950 px-5 py-3 rounded-full font-bold shadow-lg hover:shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-yellow-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {totalItems}
                </span>
              </div>
              <span className="text-sm">Ver Pedido</span>
              <span className="text-sm font-bold bg-zinc-100 px-2.5 py-0.5 rounded-full">
                ${new Intl.NumberFormat('es-AR').format(totalAmount)}
              </span>
            </Link>
          )}
        </div>

        <div className="relative z-10 lg:max-w-lg">
          <div className="flex items-center bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-1 backdrop-blur-md shadow-inner">
            <div className="pl-4 pr-3 text-zinc-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="¿Qué tenés ganas de comer hoy?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        </div>
      </header>

      {/* Info Bar — Dinámico */}
      <div className="px-6 lg:px-10 py-4 flex gap-4 overflow-x-auto custom-scrollbar">
        <div className="flex-shrink-0 flex items-center gap-2 bg-zinc-900 border border-zinc-800/80 rounded-xl px-4 py-2.5 shadow-sm">
          <Clock className={`w-4 h-4 ${isOpen ? 'text-yellow-500' : 'text-zinc-500'}`} />
          <span className="text-xs font-medium text-zinc-300">{statusText}</span>
        </div>
        <div className={`flex-shrink-0 flex items-center gap-2 bg-zinc-900 border border-zinc-800/80 rounded-xl px-4 py-2.5 shadow-sm`}>
          <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={`text-xs font-medium ${isOpen ? 'text-zinc-300' : 'text-red-400'}`}>{nextTimeText}</span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 bg-zinc-900 border border-zinc-800/80 rounded-xl px-4 py-2.5 shadow-sm">
          <MapPin className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-medium text-zinc-300">
            Envío: ${storeSettings?.delivery_cost ? new Intl.NumberFormat('es-AR').format(storeSettings.delivery_cost) : '...'}
          </span>
        </div>
        {storeSettings?.instagram_url && (
          <a href={storeSettings.instagram_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 bg-zinc-900 border border-zinc-800/80 rounded-xl px-4 py-2.5 shadow-sm hover:border-yellow-500/30 transition-colors">
            <Instagram className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-zinc-300">Instagram</span>
          </a>
        )}
      </div>

      {/* Desktop: Layout con sidebar de categorías + grilla de productos */}
      <div className="lg:flex lg:gap-8 lg:px-10">
        {/* Categories — horizontal scroll en mobile, sidebar vertical en desktop */}
        <section className="mt-4 px-6 lg:px-0 min-h-[100px] lg:min-h-0 lg:w-56 lg:flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Categorías</h2>
          </div>

          {isCategoriesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x custom-scrollbar lg:flex-col lg:overflow-x-visible lg:pb-0 lg:gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`snap-start flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all lg:w-full lg:text-left ${activeCategory === 'all'
                  ? "bg-yellow-600 text-white shadow-lg shadow-yellow-900/30 ring-1 ring-yellow-500"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800/50 hover:text-zinc-200"
                  }`}
              >
                Todo
              </button>
              {/* Tags especiales */}
              {activeTags.map((tag) => (
                <button
                  key={`tag:${tag}`}
                  onClick={() => setActiveCategory(`tag:${tag}`)}
                  className={`snap-start flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all lg:w-full lg:text-left ${activeCategory === `tag:${tag}`
                    ? "bg-yellow-600 text-white shadow-lg shadow-yellow-900/30 ring-1 ring-yellow-500"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800/50 hover:text-zinc-200"
                    }`}
                >
                  {TAG_LABELS[tag]?.emoji} {TAG_LABELS[tag]?.label}
                </button>
              ))}
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`snap-start flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all lg:w-full lg:text-left ${activeCategory === cat.id
                    ? "bg-yellow-600 text-white shadow-lg shadow-yellow-900/30 ring-1 ring-yellow-500"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800/50 hover:text-zinc-200"
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Product Grid */}
        <section className="mt-4 px-6 lg:px-0 lg:flex-1 lg:mt-0">
          <h2 className="text-lg font-bold text-white mb-4">
            {activeCategory === 'all' && !searchQuery ? 'Recomendados' : 'Resultados'}
          </h2>

          {isProductsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl py-12 text-center px-4 mb-8">
              <p className="text-zinc-400">No encontramos productos con esos filtros.</p>
            </div>
          ) : (
            <motion.div layout className="flex flex-col gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, type: 'spring', bounce: 0.2 }}
                    key={product.id}
                    className="bg-zinc-900/40 border border-zinc-800/60 rounded-[2rem] p-3 flex gap-4 relative overflow-hidden group lg:flex-col lg:p-0"
                  >
                    {/* Imagen — horizontal en mobile, encima en desktop */}
                    <div className="w-28 h-28 lg:w-full lg:h-48 bg-zinc-800 rounded-3xl lg:rounded-b-none lg:rounded-t-[2rem] flex-shrink-0 border border-zinc-700/50 lg:border-0 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url.startsWith('http') ? product.image_url : `${API_URL}${product.image_url}`} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-zinc-600 text-xs text-center px-2">Sin<br />Imagen</span>
                      )}
                    </div>
                    <div className="flex-1 py-1 pr-12 lg:p-4 lg:pr-14">
                      <h3 className="font-bold text-zinc-100 text-[15px] leading-tight mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-extrabold text-yellow-500 text-lg">
                          ${new Intl.NumberFormat('es-AR').format(product.price)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="absolute bottom-3 right-3 lg:bottom-4 lg:right-4 w-10 h-10 bg-white hover:bg-zinc-200 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all text-black hover:text-yellow-500"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </div>

      {/* Floating Cart Button — solo en mobile */}
      {totalItems > 0 && (
        <div className="lg:hidden fixed bottom-6 inset-x-0 z-50 flex justify-center px-6 pointer-events-none animate-in slide-in-from-bottom-5 duration-300">
          <Link href="/cart" className="pointer-events-auto w-full max-w-[360px] bg-white text-zinc-950 px-6 py-4 rounded-full font-bold shadow-2xl shadow-yellow-500/20 flex items-center justify-between active:scale-[0.98] transition-all border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-100 p-2 rounded-full relative">
                <ShoppingBag className="w-5 h-5 text-black" />
                <span className="absolute -top-1 -right-1 bg-yellow-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {totalItems}
                </span>
              </div>
              <span className="text-sm">Ver Pedido</span>
            </div>
            <span className="text-lg tracking-tight bg-zinc-100 px-3 py-1 rounded-full">
              ${new Intl.NumberFormat('es-AR').format(totalAmount)}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

