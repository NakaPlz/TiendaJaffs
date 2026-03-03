"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { Plus, Trash2, Edit3, Image as ImageIcon, Loader2, UploadCloud, Tag } from "lucide-react";
import toast from "react-hot-toast";

// Tags predefinidos disponibles para asignar a productos
const AVAILABLE_TAGS = [
    { key: "recomendados", label: "⭐ Recomendados", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    { key: "ofertas", label: "🔥 Ofertas", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    { key: "nuevo", label: "✨ Nuevo", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { key: "popular", label: "💎 Popular", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
];

// Fetcher standard para SWR
const fetcher = (url: string) => axios.get(url).then(res => res.data);

// URL de nuestra API Python local temporal (leído del env)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Product {
    id: number;
    name: string;
    price: number;
    description?: string;
    image_url?: string;
    available: boolean;
    tags?: string[];
}

interface Category {
    id: number;
    name: string;
    image_url?: string;
    products: Product[];
}

export default function MenuManagementPage() {
    const { data: categories, error, mutate, isLoading } = useSWR<Category[]>(`${API_URL}/categories/`, fetcher);
    const [isCreatingCat, setIsCreatingCat] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatImage, setNewCatImage] = useState("");

    // Estado para creación de productos: Qué categoría tiene el form abierto
    const [addingProductToCat, setAddingProductToCat] = useState<number | null>(null);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", image_url: "" });

    // Estado para edición de Categoría
    const [editingCatId, setEditingCatId] = useState<number | null>(null);
    const [editCat, setEditCat] = useState({ name: "", image_url: "" });

    // Estado para edición de Producto
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [editProduct, setEditProduct] = useState({ name: "", price: "", description: "", image_url: "", tags: [] as string[], priority: "0" });

    // Estado local para ver spinners durante la carga de las fotos
    const [isUploading, setIsUploading] = useState(false);

    // Función genérica para subir una imagen seleccionada por el usuario
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validamos basicos
        if (!file.type.startsWith("image/")) {
            return toast.error("Solo se permiten imágenes");
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await axios.post(`${API_URL}/upload/image/`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            // El backend devuelve algo como: { url: "/uploads/hs34h...jpg" }
            // Construimos la URL absoluta concatenando el host del API
            const backUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
            callback(`${backUrl}${res.data.url}`);
            toast.success("Foto cargada");
        } catch (error) {
            toast.error("Error al subir archivo");
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;

        try {
            await axios.post(`${API_URL}/categories/`, { name: newCatName, image_url: newCatImage || null });
            toast.success("Categoría creada");
            setNewCatName("");
            setNewCatImage("");
            setIsCreatingCat(false);
            mutate(); // Recarga la data interactiva
        } catch (err) {
            toast.error("Error al crear. Intenta nuevamente.");
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("¿Seguro que deseas eliminar esta categoría? (Se borrarán sus productos)")) return;
        try {
            await axios.delete(`${API_URL}/categories/${id}`);
            toast.success("Categoría eliminada");
            mutate();
        } catch (err) {
            toast.error("Ocurrió un error.");
        }
    };

    const handleUpdateCategory = async (e: React.FormEvent, id: number) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/categories/${id}`, { name: editCat.name, image_url: editCat.image_url || null });
            toast.success("Categoría actualizada");
            setEditingCatId(null);
            mutate();
        } catch {
            toast.error("Error al actualizar la categoría.");
        }
    };

    const handleCreateProduct = async (e: React.FormEvent, categoryId: number) => {
        e.preventDefault();
        if (!newProduct.name.trim() || !newProduct.price) return toast.error("Llena el nombre y precio.");

        try {
            await axios.post(`${API_URL}/products/`, {
                name: newProduct.name,
                description: newProduct.description,
                price: parseFloat(newProduct.price),
                image_url: newProduct.image_url || null,
                category_id: categoryId,
            });
            toast.success("Producto añadido a la carta");
            setAddingProductToCat(null);
            setNewProduct({ name: "", price: "", description: "", image_url: "" });
            mutate();
        } catch (err) {
            toast.error("Error al crear el producto.");
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent, id: number, categoryId: number) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/products/${id}`, {
                name: editProduct.name,
                description: editProduct.description,
                price: parseFloat(editProduct.price),
                image_url: editProduct.image_url || null,
                category_id: categoryId,
                tags: editProduct.tags,
                order_index: parseInt(editProduct.priority) || 0,
            });
            toast.success("Producto modificado");
            setEditingProductId(null);
            mutate();
        } catch {
            toast.error("Error al modificar el producto.");
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
        try {
            await axios.delete(`${API_URL}/products/${id}`);
            toast.success("Producto eliminado");
            mutate();
        } catch (err) {
            toast.error("Error al eliminar el producto.");
        }
    };

    if (error) return <div className="p-8 text-red-400">Error al cargar el menú. ¿Pudiste encender el Backend Python en el puerto 8000?</div>;

    return (
        <div className="p-8 pb-32">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gestión de la Carta</h1>
                    <p className="text-zinc-400 mt-1">Administra tus categorías, platos y existencias.</p>
                </div>
                <button
                    onClick={() => setIsCreatingCat(!isCreatingCat)}
                    className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2.5 rounded-xl font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Categoría
                </button>
            </div>

            {isCreatingCat && (
                <form onSubmit={handleCreateCategory} className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Nombre de Categoria</label>
                        <input
                            autoFocus
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="Ej. Hamburguesas, Pizzas, Bebidas..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Foto de Categoría (Opcional)</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                disabled={isUploading}
                                onChange={(e) => handleFileUpload(e, setNewCatImage)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                            />
                            <div className="w-full bg-zinc-950 border border-zinc-800 border-dashed rounded-xl px-4 py-3 text-zinc-500 focus-within:ring-2 focus-within:ring-yellow-500 flex items-center gap-2">
                                <UploadCloud className="w-4 h-4 text-zinc-400" />
                                <span className="truncate">{newCatImage ? "Imagen seleccionada ✓" : "Habilitar para subir foto..."}</span>
                            </div>
                        </div>
                        {newCatImage && (
                            <img src={newCatImage} alt="preview" className="mt-2 w-12 h-12 object-cover rounded-lg border border-zinc-700" />
                        )}
                    </div>
                    <button type="submit" className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                        Guardar
                    </button>
                    <button type="button" onClick={() => setIsCreatingCat(false)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-3 rounded-xl font-medium transition-colors">
                        Cancelar
                    </button>
                </form>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                </div>
            ) : categories?.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
                    <UtensilsIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">Tu carta está vacía</h3>
                    <p className="text-zinc-500 mt-1">Comienza agregando tu primera categoría.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {categories?.map((cat) => (
                        <div key={cat.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            {editingCatId === cat.id ? (
                                <form onSubmit={(e) => handleUpdateCategory(e, cat.id)} className="bg-zinc-950/50 p-4 border-b border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <input
                                        autoFocus
                                        value={editCat.name}
                                        onChange={e => setEditCat({ ...editCat, name: e.target.value })}
                                        className="w-full md:w-auto flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-yellow-500 outline-none"
                                        placeholder="Nombre Categoría"
                                    />
                                    <div className="w-full md:w-auto flex-1">
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                disabled={isUploading}
                                                onChange={(e) => handleFileUpload(e, (url) => setEditCat({ ...editCat, image_url: url }))}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                                            />
                                            <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-lg px-3 py-2 text-zinc-500 flex items-center gap-2">
                                                <UploadCloud className="w-4 h-4 text-zinc-400" />
                                                <span className="truncate text-sm">{editCat.image_url ? "Modificar imagen..." : "Subir foto..."}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button type="submit" className="text-yellow-500 font-medium text-sm hover:underline">Guardar</button>
                                        <button type="button" onClick={() => setEditingCatId(null)} className="text-zinc-500 text-sm hover:text-white transition-colors">Cancelar</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="bg-zinc-950/50 p-4 border-b border-zinc-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-800">
                                            {cat.image_url ? (
                                                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-yellow-500" />
                                            )}
                                        </div>
                                        <h2 className="text-xl font-semibold text-white">{cat.name}</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                            onClick={() => { setEditingCatId(cat.id); setEditCat({ name: cat.name, image_url: cat.image_url || "" }); }}
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="p-6">
                                {cat.products.length === 0 ? (
                                    <p className="text-zinc-500 text-sm text-center py-4">No hay productos en esta categoría.</p>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {cat.products.map(product => (
                                            editingProductId === product.id ? (
                                                <div key={product.id} className="p-4 border border-zinc-800 bg-zinc-900 rounded-xl space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-500 mb-1">Nombre</label>
                                                            <input autoFocus required value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-yellow-500 outline-none" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-500 mb-1">Precio ($)</label>
                                                            <input required type="number" step="0.01" value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-yellow-500 outline-none" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-500 mb-1">Prioridad (mayor = primero)</label>
                                                            <input type="number" value={editProduct.priority} onChange={e => setEditProduct({ ...editProduct, priority: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-yellow-500 outline-none" placeholder="0" />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs font-medium text-zinc-500 mb-1">Descripción corta</label>
                                                            <input value={editProduct.description} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-yellow-500 outline-none" />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs font-medium text-zinc-500 mb-1">Foto (Opcional)</label>
                                                            <div className="relative">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    disabled={isUploading}
                                                                    onChange={(e) => handleFileUpload(e, (url) => setEditProduct({ ...editProduct, image_url: url }))}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                                                                />
                                                                <div className="w-full bg-zinc-950 border border-zinc-800 border-dashed rounded-lg px-3 py-2 text-sm text-zinc-500 flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <UploadCloud className="w-4 h-4 text-zinc-400" />
                                                                        <span>{editProduct.image_url ? "Modificar foto actual..." : "Haga cick para buscar un archivo"}</span>
                                                                    </div>
                                                                    {editProduct.image_url && <img src={editProduct.image_url} className="w-6 h-6 rounded object-cover" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Tags */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-zinc-500 mb-2">Etiquetas</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {AVAILABLE_TAGS.map(tag => (
                                                                <button
                                                                    key={tag.key}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditProduct(prev => ({
                                                                            ...prev,
                                                                            tags: prev.tags.includes(tag.key)
                                                                                ? prev.tags.filter(t => t !== tag.key)
                                                                                : [...prev.tags, tag.key]
                                                                        }));
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${editProduct.tags.includes(tag.key)
                                                                        ? tag.color
                                                                        : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600'
                                                                        }`}
                                                                >
                                                                    {tag.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 justify-end pt-2">
                                                        <button type="button" onClick={() => setEditingProductId(null)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                                                        <button onClick={(e) => handleUpdateProduct(e, product.id, cat.id)} className="px-4 py-2 text-sm font-medium bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors">Guardar Cambios</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div key={product.id} className="flex items-center gap-4 p-4 border border-zinc-800/50 rounded-xl hover:bg-zinc-800/30 transition-colors group">
                                                    <div className="w-16 h-16 bg-zinc-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-zinc-700/50">
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="w-6 h-6 text-zinc-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-white font-medium truncate">{product.name}</h4>
                                                            {product.tags && product.tags.length > 0 && (
                                                                <div className="flex gap-1 flex-shrink-0">
                                                                    {product.tags.map(t => {
                                                                        const tagDef = AVAILABLE_TAGS.find(at => at.key === t);
                                                                        return tagDef ? <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${tagDef.color}`}>{tagDef.label.split(' ')[0]}</span> : null;
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-zinc-500 text-sm truncate">{product.description || "Sin descripción"}</p>
                                                        <p className="text-yellow-400 font-semibold mt-1">${product.price.toFixed(2)}</p>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                        <button
                                                            onClick={() => { setEditingProductId(product.id); setEditProduct({ name: product.name, price: product.price.toString(), description: product.description || "", image_url: product.image_url || "", tags: product.tags || [], priority: (product as any).order_index?.toString() || "0" }); }}
                                                            className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}

                                {addingProductToCat === cat.id ? (
                                    <form onSubmit={(e) => handleCreateProduct(e, cat.id)} className="mt-4 p-4 border border-zinc-800 bg-zinc-950/50 rounded-xl space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 mb-1">Nombre del Plato</label>
                                                <input autoFocus required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-yellow-500 outline-none" placeholder="Ej. Lomo Completo" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 mb-1">Precio ($)</label>
                                                <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-yellow-500 outline-none" placeholder="0.00" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-zinc-500 mb-1">Descripción corta (opcional)</label>
                                                <input value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-yellow-500 outline-none" placeholder="Ingredientes, detalles..." />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-zinc-500 mb-1">Foto del Plato (opcional)</label>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        disabled={isUploading}
                                                        onChange={(e) => handleFileUpload(e, (url) => setNewProduct({ ...newProduct, image_url: url }))}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                                                    />
                                                    <div className="w-full bg-zinc-900 border border-zinc-800 border-dashed rounded-lg px-3 py-2 text-sm text-zinc-500 flex items-center gap-2">
                                                        <UploadCloud className="w-4 h-4 text-zinc-400" />
                                                        <span>{newProduct.image_url ? "Imagen lista ✓" : "Subir archivo de mi PC..."}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end pt-2">
                                            <button type="button" onClick={() => setAddingProductToCat(null)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                                            <button type="submit" className="px-4 py-2 text-sm font-medium bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors">Guardar Producto</button>
                                        </div>
                                    </form>
                                ) : (
                                    <button
                                        onClick={() => setAddingProductToCat(cat.id)}
                                        className="mt-4 w-full py-3 border border-dashed border-zinc-700 hover:border-yellow-500 hover:text-yellow-500 rounded-xl flex items-center justify-center gap-2 text-zinc-400 font-medium transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Agregar Producto a {cat.name}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function UtensilsIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
    );
}

