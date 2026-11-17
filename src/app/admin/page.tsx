
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  active: boolean;
};

type OrderItem = {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  image_url?: string | null;
};

type Order = {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_method: string;
  shipping_address: string | null;
  customer_notes: string | null;
  payment_method: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
};

const orderStatuses = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("products");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Velas");
  const [image, setImage] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("No pudimos cargar los productos.");
      console.error(error);
    } else {
      setProducts(data || []);
    }
  }

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError("No pudimos cargar los pedidos.");
    } else {
      setOrders((data || []) as Order[]);
    }
  }

  async function checkAdmin(userId: string) {
    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      setAuthorized(false);
      setError("Tu usuario no tiene permisos de administrador.");
      setLoading(false);
      return;
    }

    setAuthorized(true);
    setError("");

    await Promise.all([loadProducts(), loadOrders()]);

    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!active) return;

      if (data.session) {
        await checkAdmin(data.session.user.id);
      } else {
        setLoading(false);
      }
    }

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;

        if (event === "SIGNED_IN" && session) {
          setLoading(true);
          checkAdmin(session.user.id);
        }

        if (event === "SIGNED_OUT") {
          setAuthorized(false);
          setProducts([]);
          setOrders([]);
          setLoading(false);
        }
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setCategory("Velas");
    setImage(null);
    setEditingId(null);
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description);
    setPrice(String(product.price));
    setCategory(product.category);
    setImage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      let imageUrl: string | null = null;

      if (image) {
        const extension = image.name.split(".").pop() || "jpg";
        const filePath = `${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;
      }

      const productData = {
        name,
        description,
        price: Number(price),
        category,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      };

      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .insert(productData);

        if (error) throw error;
      }

      resetForm();
      await loadProducts();
      alert(editingId ? "Producto actualizado." : "Producto agregado.");
    } catch (err) {
      console.error(err);
      setError(
        "No pudimos guardar el producto. Revisá los datos y los permisos de Storage."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!window.confirm("¿Seguro que querés eliminar este producto?")) {
      return;
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      setError("No pudimos eliminar el producto.");
      console.error(error);
    } else {
      await loadProducts();
    }
  }

  async function toggleActive(product: Product) {
    const { error } = await supabase
      .from("products")
      .update({ active: !product.active })
      .eq("id", product.id);

    if (error) {
      setError("No pudimos cambiar el estado del producto.");
      console.error(error);
    } else {
      await loadProducts();
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      setError("No pudimos actualizar el estado del pedido.");
    } else {
      await loadOrders();
    }
  }

  async function updatePaymentStatus(id: string, payment_status: string) {
    const { error } = await supabase
      .from("orders")
      .update({ payment_status })
      .eq("id", id);

    if (error) {
      console.error(error);
      setError("No pudimos actualizar el estado del pago.");
    } else {
      await loadOrders();
    }
  }

  function formatPrice(value: number) {
    return `$ ${value.toLocaleString("es-UY")} UYU`;
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString("es-UY", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] flex items-center justify-center">
        <p>Cargando...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] flex items-center justify-center px-6">
        <form
          onSubmit={login}
          className="w-full max-w-md bg-white p-8 border border-[#ded8ce]"
        >
          <h1 className="font-serif text-3xl text-center mb-2">
            Lindos Detalles
          </h1>
          <p className="text-center text-xs tracking-widest uppercase text-[#927e67] mb-10">
            Administración
          </p>

          <label className="text-sm">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-[#cfc4b5] p-3 mt-2 mb-5 bg-transparent"
          />

          <label className="text-sm">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-[#cfc4b5] p-3 mt-2 mb-5 bg-transparent"
          />

          {error && (
            <p className="text-sm text-red-700 mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#b5a18a] text-white py-4 text-xs tracking-widest uppercase"
          >
            Iniciar sesión
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#37332e] px-5 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center border-b border-[#ded8ce] pb-5">
          <h1 className="font-serif text-2xl md:text-3xl">
            Lindos Detalles
          </h1>
          <button onClick={logout} className="text-sm underline">
            Cerrar sesión
          </button>
        </header>

        <h2 className="font-serif text-3xl mt-10 mb-2">
          Panel de administración
        </h2>
        <p className="text-sm text-[#897f73] mb-8">
          Administrá tus productos y las compras de tu tienda.
        </p>

        <div className="flex gap-3 border-b border-[#ded8ce] mb-8">
          <button
            onClick={() => {
              setActiveTab("products");
              setError("");
            }}
            className={`px-5 py-3 text-sm ${
              activeTab === "products"
                ? "border-b-2 border-[#8c765d] text-[#6e5943]"
                : "text-[#897f73]"
            }`}
          >
            Productos ({products.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("orders");
              setError("");
              loadOrders();
            }}
            className={`px-5 py-3 text-sm ${
              activeTab === "orders"
                ? "border-b-2 border-[#8c765d] text-[#6e5943]"
                : "text-[#897f73]"
            }`}
          >
            Pedidos ({orders.length})
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 p-4 mb-6 rounded-lg">
            {error}
          </p>
        )}

        {activeTab === "products" && (
          <>
            <form
              onSubmit={saveProduct}
              className="bg-white border border-[#ded8ce] p-5 md:p-8"
            >
              <h3 className="font-serif text-2xl mb-6">
                {editingId ? "Editar producto" : "Agregar producto"}
              </h3>

              <label className="block text-sm mb-2">Fotografía</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full text-sm mb-5"
              />
              <p className="text-xs text-[#897f73] mb-5">
                {editingId
                  ? "Si no elegís otra foto, se conservará la actual."
                  : "Elegí una imagen de la galería de tu celular."}
              </p>

              <label className="block text-sm mb-2">Nombre del producto</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-[#cfc4b5] p-3 mb-5 bg-transparent"
              />

              <label className="block text-sm mb-2">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-[#cfc4b5] p-3 mb-5 bg-transparent"
              />

              <label className="block text-sm mb-2">
                Precio en pesos uruguayos
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full border border-[#cfc4b5] p-3 mb-5 bg-transparent"
              />

              <label className="block text-sm mb-2">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-[#cfc4b5] p-3 mb-6 bg-transparent"
              >
                <option value="Velas">Velas</option>
                <option value="Yeso">Yeso</option>
              </select>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#b5a18a] text-white py-4 text-xs tracking-widest uppercase disabled:opacity-50"
                >
                  {saving
                    ? "Guardando..."
                    : editingId
                    ? "Guardar cambios"
                    : "Agregar producto"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-[#b5a18a] px-6 py-4 text-xs uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <section className="mt-12">
              <h3 className="font-serif text-2xl mb-6">
                Productos de la tienda ({products.length})
              </h3>

              <div className="space-y-4">
                {products.map((product) => (
                  <article
                    key={product.id}
                    className="bg-white border border-[#ded8ce] p-4 flex gap-4 items-center"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-20 h-24 object-cover"
                      />
                    ) : (
                      <div className="w-20 h-24 bg-[#eae3d9] flex items-center justify-center text-xs">
                        Sin foto
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-lg">{product.name}</p>
                      <p className="text-xs text-[#897f73]">
                        {product.category} · $ {product.price}
                      </p>
                      <p className="text-xs mt-1">
                        {product.active ? "Publicado" : "Oculto"}
                      </p>

                      <div className="flex flex-wrap gap-3 mt-3 text-xs">
                        <button
                          type="button"
                          onClick={() => editProduct(product)}
                          className="underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(product)}
                          className="underline"
                        >
                          {product.active ? "Ocultar" : "Publicar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product.id)}
                          className="underline text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === "orders" && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-serif text-2xl">Pedidos recibidos</h3>
                <p className="text-sm text-[#897f73] mt-1">
                  Consultá las compras y actualizá sus estados.
                </p>
              </div>
              <button
                onClick={loadOrders}
                className="text-sm underline"
              >
                Actualizar
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white border border-[#ded8ce] p-8 text-center">
                <p className="font-serif text-xl mb-2">
                  Todavía no hay pedidos
                </p>
                <p className="text-sm text-[#897f73]">
                  Cuando un cliente realice una compra, aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map((order) => (
                  <article
                    key={order.id}
                    className="bg-white border border-[#ded8ce] p-5 md:p-7"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-b border-[#eee8df] pb-4 mb-5">
                      <div>
                        <p className="font-serif text-xl">
                          Pedido #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-[#897f73] mt-1">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <p className="font-serif text-xl">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#897f73] mb-2">
                          Cliente
                        </p>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="mt-1">{order.customer_phone}</p>
                        {order.customer_email && (
                          <p className="mt-1 break-all">
                            {order.customer_email}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#897f73] mb-2">
                          Entrega y pago
                        </p>
                        <p>
                          {order.delivery_method === "shipping"
                            ? "Envío a domicilio"
                            : "Retiro"}
                        </p>
                        {order.shipping_address && (
                          <p className="text-[#897f73] mt-1">
                            {order.shipping_address}
                          </p>
                        )}
                        <p className="mt-2">
                          {order.payment_method === "bank_transfer"
                            ? "Transferencia bancaria"
                            : "Mercado Pago"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-[#eee8df] pt-4">
                      <p className="text-xs uppercase tracking-wider text-[#897f73] mb-3">
                        Productos
                      </p>

                      <div className="space-y-2">
                        {Array.isArray(order.items) &&
                          order.items.map((item, index) => (
                            <div
                              key={`${item.product_id}-${index}`}
                              className="flex justify-between gap-3 text-sm"
                            >
                              <span>
                                {item.name} × {item.quantity}
                              </span>
                              <span className="whitespace-nowrap">
                                {formatPrice(item.subtotal)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {order.customer_notes && (
                      <div className="mt-4 bg-[#f7f4ee] p-3 text-sm rounded-lg">
                        <p className="text-xs uppercase tracking-wider text-[#897f73] mb-1">
                          Comentarios del cliente
                        </p>
                        {order.customer_notes}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 border-t border-[#eee8df] pt-5">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#897f73] mb-2">
                          Estado del pedido
                        </label>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(order.id, e.target.value)
                          }
                          className="w-full border border-[#cfc4b5] p-3 bg-white rounded-lg text-sm"
                        >
                          {orderStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                          {!orderStatuses.some(
                            (status) => status.value === order.status
                          ) && (
                            <option value={order.status}>
                              {order.status}
                            </option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#897f73] mb-2">
                          Estado del pago
                        </label>
                        <select
                          value={order.payment_status}
                          onChange={(e) =>
                            updatePaymentStatus(order.id, e.target.value)
                          }
                          className="w-full border border-[#cfc4b5] p-3 bg-white rounded-lg text-sm"
                        >
                          <option value="pending">Pendiente de pago</option>
                          <option value="paid">Pagado</option>
                          <option value="refunded">Reembolsado</option>
                        </select>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

