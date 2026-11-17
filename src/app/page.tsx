
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
};

const heroImage =
  "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=1400";

const fallbackImage =
  "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [category, setCategory] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) {
        setError("No pudimos cargar los productos.");
        console.error(error);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    }

    loadProducts();
  }, []);

  const filtered =
    category === "Todos"
      ? products
      : products.filter((product) => product.category === category);

  const total = cart.reduce((sum, id) => {
    const product = products.find((item) => item.id === id);
    return sum + (product?.price || 0);
  }, 0);

  const money = (value: number) =>
    "$ " + value.toLocaleString("es-UY");

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#39342f]">
      {/* ENCABEZADO */}
      <header className="sticky top-0 z-40 bg-[#faf8f4]/95 backdrop-blur-sm border-b border-[#e8e1d7]">
        <div className="max-w-7xl mx-auto px-5 md:px-12 h-20 md:h-24 flex items-center justify-between gap-4">
          <a href="#inicio" className="shrink-0">
            <span className="font-serif text-xl md:text-3xl tracking-tight whitespace-nowrap">
              Lindos Detalles
            </span>
            <span className="block text-[8px] md:text-[9px] tracking-[0.38em] uppercase text-[#9b8873] text-center mt-1">
              Hecho con amor
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-9 text-[10px] tracking-[0.2em] uppercase text-[#756b60]">
            <a href="#inicio" className="hover:text-[#b19a7d]">Inicio</a>
            <a href="#productos" className="hover:text-[#b19a7d]">Tienda</a>
            <a href="#nosotros" className="hover:text-[#b19a7d]">Nosotros</a>
            <a href="#contacto" className="hover:text-[#b19a7d]">Contacto</a>
          </nav>

          <button
            onClick={() => setShowCart(true)}
            className="shrink-0 border border-[#cbbba6] px-3 md:px-5 py-3 text-[10px] md:text-xs tracking-widest uppercase hover:bg-[#eee8df] transition"
          >
            Bolsa ({cart.length})
          </button>
        </div>
      </header>

      {/* PRESENTACIÓN */}
      <section id="inicio" className="max-w-7xl mx-auto px-5 md:px-12 pt-10 md:pt-16 pb-14 md:pb-20">
        <div className="grid md:grid-cols-2 items-center gap-9 md:gap-16">
          <div className="order-1">
            <p className="text-[10px] md:text-xs tracking-[0.32em] uppercase text-[#a18b70] mb-5 md:mb-7">
              Objetos que hacen hogar
            </p>

            <h1 className="font-serif text-[42px] leading-[1.12] md:text-6xl lg:text-7xl md:leading-[1.08] tracking-tight max-w-xl">
              Pequeños detalles,
              <span className="block italic text-[#a58f75]">
                grandes momentos.
              </span>
            </h1>

            <p className="text-sm md:text-base leading-7 text-[#81776c] max-w-md mt-6 md:mt-8">
              Velas artesanales y piezas decorativas hechas con dedicación
              para llenar tus espacios de calidez.
            </p>

            <a
              href="#productos"
              className="inline-block mt-8 md:mt-10 bg-[#ad987e] text-white px-8 py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-[#958069] transition"
            >
              Explorar colección
            </a>
          </div>

          <div className="order-2">
            <div className="aspect-[5/4] md:aspect-[4/5] overflow-hidden bg-[#eee8df]">
              <img
                src={heroImage}
                alt="Velas artesanales y decoración"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-[9px] tracking-[0.25em] uppercase text-[#9b8873] text-right mt-3">
              Creaciones hechas a mano
            </p>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS DESTACADAS */}
      <section className="border-y border-[#e8e1d7] bg-[#f3efe8]">
        <div className="max-w-7xl mx-auto grid grid-cols-3 px-3 md:px-12">
          {[
            "Velas artesanales",
            "Decoración en yeso",
            "Hecho a mano",
          ].map((item, index) => (
            <div
              key={item}
              className={`py-7 md:py-10 text-center ${
                index !== 2 ? "border-r border-[#e1d8cc]" : ""
              }`}
            >
              <p className="font-serif text-sm md:text-xl">{item}</p>
              <p className="hidden md:block text-[9px] tracking-[0.25em] uppercase text-[#a18b70] mt-2">
                Lindos Detalles
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTOS */}
      <section id="productos" className="max-w-7xl mx-auto px-5 md:px-12 py-16 md:py-24">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#a18b70] mb-4">
            Nuestra selección
          </p>
          <h2 className="font-serif text-3xl md:text-5xl">
            Productos destacados
          </h2>
          <p className="text-xs md:text-sm text-[#897f73] mt-4">
            Piezas creadas para acompañar tus momentos especiales.
          </p>
        </div>

        <div className="flex justify-center gap-2 md:gap-4 mb-10 flex-wrap">
          {["Todos", "Velas", "Yeso"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 md:px-7 py-3 text-[9px] tracking-[0.2em] uppercase border transition ${
                category === cat
                  ? "bg-[#ad987e] text-white border-[#ad987e]"
                  : "border-[#d8cbbb] text-[#756b60] hover:bg-[#eee8df]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-center text-sm text-[#897f73]">
            Cargando productos...
          </p>
        )}

        {error && (
          <p className="text-center text-sm text-red-700">{error}</p>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="text-center text-sm text-[#897f73]">
            Próximamente tendremos productos disponibles.
          </p>
        )}

        {!loading && !error && products.length > 0 && filtered.length === 0 && (
          <p className="text-center text-sm text-[#897f73]">
            Todavía no hay productos en esta categoría.
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-7 md:gap-y-14">
          {filtered.map((product) => (
            <article key={product.id} className="group">
              <div className="aspect-[4/5] overflow-hidden bg-[#eee8df] mb-4">
                <img
                  src={product.image_url || fallbackImage}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>

              <p className="text-[9px] tracking-[0.2em] uppercase text-[#a18b70]">
                {product.category}
              </p>

              <h3 className="font-serif text-base md:text-xl mt-2">
                {product.name}
              </h3>

              <p className="text-[11px] md:text-xs text-[#897f73] leading-5 mt-2 min-h-10">
                {product.description}
              </p>

              <p className="text-sm mt-3 mb-4">
                {money(product.price)}
              </p>

              <button
                onClick={() => setCart((old) => [...old, product.id])}
                className="w-full border border-[#b5a18a] py-3 text-[9px] tracking-[0.15em] uppercase hover:bg-[#ad987e] hover:text-white transition"
              >
                Agregar a la bolsa
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* NOSOTROS */}
      <section id="nosotros" className="bg-[#eee8df] px-6 py-16 md:py-24 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#a18b70] mb-5">
          Nuestra esencia
        </p>
        <h2 className="font-serif text-3xl md:text-5xl max-w-2xl mx-auto leading-tight">
          Hecho a mano, pensado para vos.
        </h2>
        <p className="max-w-xl mx-auto text-sm leading-7 text-[#756c61] mt-6">
          Cada pieza de Lindos Detalles nace del amor por los pequeños
          detalles, los espacios cálidos y los objetos únicos.
        </p>
      </section>

      {/* PIE DE PÁGINA */}
      <footer id="contacto" className="px-6 py-12 md:py-16 text-center">
        <h2 className="font-serif text-2xl md:text-3xl mb-3">
          Lindos Detalles
        </h2>
        <p className="text-xs text-[#897f73] mb-6">
          Objetos hechos con amor.
        </p>
        <a
          href="https://www.instagram.com/lindosdetalles_uy/"
          target="_blank"
          rel="noreferrer"
          className="text-[10px] tracking-[0.2em] uppercase underline underline-offset-4"
        >
          Seguinos en Instagram
        </a>
        <p className="text-[10px] text-[#a59b8e] mt-10">
          © 2026 Lindos Detalles
        </p>
      </footer>

      {/* CARRITO */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="bg-[#faf8f4] w-full max-w-md h-full p-6 md:p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <div>
                <p className="text-[9px] tracking-[0.25em] uppercase text-[#a18b70]">
                  Lindos Detalles
                </p>
                <h2 className="font-serif text-3xl mt-1">Tu bolsa</h2>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="text-2xl text-[#81776c]"
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-[#897f73]">
                Tu bolsa está vacía.
              </p>
            ) : (
              <>
                {cart.map((id, index) => {
                  const product = products.find((item) => item.id === id);
                  if (!product) return null;

                  return (
                    <div
                      key={`${id}-${index}`}
                      className="flex justify-between items-center border-b border-[#e8e1d7] py-4 gap-4"
                    >
                      <div>
                        <p className="font-serif">{product.name}</p>
                        <p className="text-sm mt-1">
                          {money(product.price)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setCart((old) => old.filter((_, i) => i !== index))
                        }
                        className="text-xs underline text-[#897f73]"
                      >
                        Quitar
                      </button>
                    </div>
                  );
                })}

                <div className="flex justify-between mt-8 text-lg font-serif">
                  <span>Total</span>
                  <span>{money(total)}</span>
 </div>

<button
  onClick={() => {
    sessionStorage.setItem(
      "lindos-detalles-cart",
      JSON.stringify(cart)
    );
    window.location.href = "/checkout";
  }}
  className="w-full bg-[#ad987e] text-white py-4 mt-8 text-[10px] tracking-[0.2em] uppercase hover:bg-[#958069] transition"
>
  Continuar con la compra
</button>
</>
)}

          </div>
        </div>
      )}
    </main>
  );
}

