
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
};

type CartItem = Product & {
  quantity: number;
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState("shipping");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState("bank_transfer");

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    async function loadCart() {
      try {
        const savedCart = sessionStorage.getItem("lindos-detalles-cart");
        const ids: string[] = savedCart ? JSON.parse(savedCart) : [];

        if (!ids.length) {
          setItems([]);
          setLoading(false);
          return;
        }

        const quantities = new Map<string, number>();

        ids.forEach((id) => {
          quantities.set(id, (quantities.get(id) || 0) + 1);
        });

        const { data, error } = await supabase
          .from("products")
          .select("id, name, price, image_url")
          .in("id", Array.from(quantities.keys()))
          .eq("active", true);

        if (error) throw error;

        const cartItems = (data || []).map((product) => ({
          ...product,
          quantity: quantities.get(product.id) || 0,
        }));

        setItems(cartItems);
      } catch (err) {
        console.error(err);
        setError("No pudimos cargar tu carrito. Volvé a intentarlo.");
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!items.length) {
      setError("Tu carrito está vacío.");
      return;
    }

    if (payment === "mercado_pago" && !email.trim()) {
      setError("Ingresá tu correo electrónico para pagar con Mercado Pago.");
      return;
    }

    setSending(true);

    try {
      // Primero registramos el pedido en nuestra base de datos.
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: name,
          customer_email: email || null,
          customer_phone: phone,
          delivery_method: delivery,
          shipping_address: delivery === "shipping" ? address : null,
          customer_notes: notes,
          payment_method: payment,
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No pudimos registrar tu pedido.");
      }

      const newOrderId = result.order.id;

      // Si eligió Mercado Pago, creamos la orden de pago.
      if (payment === "mercado_pago") {
        const paymentResponse = await fetch(
          "/api/mercadopago/create-order",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: newOrderId,
            }),
          }
        );

        const paymentResult = await paymentResponse.json();

        if (!paymentResponse.ok || !paymentResult.checkout_url) {
          throw new Error(
            paymentResult.error || "No pudimos iniciar el pago."
          );
        }

        sessionStorage.removeItem("lindos-detalles-cart");

        // Enviamos al cliente al checkout seguro de Mercado Pago.
        window.location.href = paymentResult.checkout_url;
        return;
      }

      // Si eligió transferencia, mostramos la confirmación habitual.
      setOrderId(newOrderId);
      sessionStorage.removeItem("lindos-detalles-cart");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error. Intentá nuevamente."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf8f4] flex items-center justify-center text-[#766b5d]">
        Cargando tu compra...
      </main>
    );
  }

  if (orderId) {
    return (
      <main className="min-h-screen bg-[#faf8f4] px-5 py-16">
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-8 md:p-12 text-center shadow-sm">
          <div className="text-4xl mb-5">✓</div>
          <h1 className="text-3xl font-serif text-[#514638] mb-4">
            ¡Gracias por tu pedido!
          </h1>
          <p className="text-[#766b5d] leading-relaxed mb-6">
            Recibimos correctamente tu pedido. Nos pondremos en contacto
            contigo para coordinar los próximos pasos del pago y la entrega.
          </p>
          <p className="text-sm text-[#9a8d7c] mb-2">
            Número de pedido
          </p>
          <p className="font-medium text-[#514638] break-all mb-8">
            {orderId}
          </p>
          <Link
            href="/"
            className="inline-block bg-[#75634f] text-white px-8 py-3 rounded-full hover:bg-[#5e4f3f] transition"
          >
            Volver a la tienda
          </Link>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="min-h-screen bg-[#faf8f4] px-5 py-20 text-center">
        <h1 className="text-3xl font-serif text-[#514638] mb-4">
          Tu carrito está vacío
        </h1>
        <p className="text-[#766b5d] mb-8">
          Agregá algún detalle especial antes de continuar.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#75634f] text-white px-8 py-3 rounded-full"
        >
          Volver a la tienda
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#514638]">
      <header className="border-b border-[#e9e2d8] bg-[#faf8f4]">
        <div className="max-w-6xl mx-auto px-5 py-6">
          <Link href="/" className="text-sm text-[#8b7b68] hover:underline">
            ← Volver a la tienda
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif mt-5">
            Finalizar compra
          </h1>
          <p className="text-[#8b7b68] mt-2">
            Estás a un paso de recibir tus Lindos Detalles.
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-serif mb-6">Tus datos</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm mb-2">Nombre y apellido</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#e5ded4] rounded-xl px-4 py-3 outline-none focus:border-[#9a866e]"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Teléfono</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-[#e5ded4] rounded-xl px-4 py-3 outline-none focus:border-[#9a866e]"
                  placeholder="Tu teléfono de contacto"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Correo electrónico {payment === "mercado_pago" ? "(obligatorio)" : "(opcional)"}
                </label>
                <input
                  required={payment === "mercado_pago"}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#e5ded4] rounded-xl px-4 py-3 outline-none focus:border-[#9a866e]"
                  placeholder="tu@email.com"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-serif mb-6">
              ¿Cómo querés recibir tu pedido?
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 border border-[#e5ded4] rounded-xl p-4 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  value="shipping"
                  checked={delivery === "shipping"}
                  onChange={(e) => setDelivery(e.target.value)}
                />
                <span>
                  <strong className="block font-medium">Envío a domicilio</strong>
                  <span className="text-sm text-[#8b7b68]">
                    Coordinaremos la entrega contigo.
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-3 border border-[#e5ded4] rounded-xl p-4 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  value="pickup"
                  checked={delivery === "pickup"}
                  onChange={(e) => setDelivery(e.target.value)}
                />
                <span>
                  <strong className="block font-medium">Retiro</strong>
                  <span className="text-sm text-[#8b7b68]">
                    Coordinaremos contigo el retiro.
                  </span>
                </span>
              </label>
            </div>

            {delivery === "shipping" && (
              <div className="mt-5">
                <label className="block text-sm mb-2">
                  Dirección de envío
                </label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full border border-[#e5ded4] rounded-xl px-4 py-3 outline-none focus:border-[#9a866e]"
                  placeholder="Calle, número, localidad y otros datos"
                />
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-serif mb-6">Forma de pago</h2>

            <label className="flex items-center gap-3 border border-[#e5ded4] rounded-xl p-4 mb-4 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="bank_transfer"
                checked={payment === "bank_transfer"}
                onChange={(e) => setPayment(e.target.value)}
              />
              <span>
                <strong className="block font-medium">
                  Transferencia bancaria
                </strong>
                <span className="text-sm text-[#8b7b68]">
                  Te enviaremos los datos para realizar el pago.
                </span>
              </span>
            </label>

            <label className="flex items-center gap-3 border border-[#e5ded4] rounded-xl p-4 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="mercado_pago"
                checked={payment === "mercado_pago"}
                onChange={(e) => setPayment(e.target.value)}
              />
              <span>
                <strong className="block font-medium">Mercado Pago</strong>
                <span className="text-sm text-[#8b7b68]">
                  Pagá de forma segura desde Mercado Pago.
                </span>
              </span>
            </label>
          </section>

          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
            <label className="block text-sm mb-2">
              Comentarios adicionales (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-[#e5ded4] rounded-xl px-4 py-3 outline-none focus:border-[#9a866e]"
              placeholder="¿Querés indicarnos algo sobre tu pedido?"
            />
          </section>

          {error && (
            <p className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-[#75634f] text-white py-4 rounded-full hover:bg-[#5e4f3f] transition disabled:opacity-60"
          >
            {sending
              ? "Procesando pedido..."
              : payment === "mercado_pago"
                ? "Continuar a Mercado Pago"
                : "Confirmar pedido"}
          </button>

          <p className="text-xs text-center text-[#9a8d7c]">
            El costo de envío, si corresponde, se coordinará por separado.
          </p>
        </form>

        <aside className="h-fit bg-white rounded-2xl p-6 md:p-8 shadow-sm lg:sticky lg:top-8">
          <h2 className="text-xl font-serif mb-6">
            Resumen de tu pedido
          </h2>

          <div className="space-y-5">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl bg-[#f4f0e9]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#f4f0e9]" />
                )}

                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-[#8b7b68]">
                    Cantidad: {item.quantity}
                  </p>
                </div>

                <p className="text-sm font-medium whitespace-nowrap">
                  ${ (item.price * item.quantity).toLocaleString("es-UY") }
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-[#e9e2d8] mt-6 pt-5 flex justify-between items-center">
            <span className="text-[#8b7b68]">Total</span>
            <strong className="text-2xl font-serif">
              ${total.toLocaleString("es-UY")}
            </strong>
          </div>

          <p className="text-xs text-[#9a8d7c] mt-4">
            El costo de envío, si corresponde, se coordinará por separado.
          </p>
        </aside>
      </div>
    </main>
  );
}
