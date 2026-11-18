
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

type Service = {
  title: string;
  description: string;
  image: string;
  category: string;
};

type SiteContent = {
  hero_image: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_highlight: string;
  hero_description: string;
  hero_button: string;
  collections_eyebrow: string;
  collections_title: string;
  services: Service[];
  about_eyebrow: string;
  about_title: string;
  about_highlight: string;
  about_description: string;
  about_button: string;
  about_image: string;
  banner_eyebrow: string;
  banner_title: string;
  banner_button: string;
  banner_image: string;
  footer_tagline: string;
  footer_description: string;
  footer_attention_title: string;
  footer_shipping: string;
  footer_pickup: string;
  footer_contact: string;
  footer_social_title: string;
  footer_social_label: string;
  footer_copyright: string;
};

const heroImage =
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1800";

const fallbackImage =
  "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800";

const defaultSiteContent: SiteContent = {
  hero_image: heroImage,
  hero_eyebrow: "Lindos Detalles · Objetos con encanto",
  hero_title: "Pequeños detalles,",
  hero_highlight: "grandes momentos.",
  hero_description:
    "Velas artesanales y piezas decorativas hechas con dedicación para llenar tus espacios de belleza y calidez.",
  hero_button: "Descubrir la colección →",

  collections_eyebrow: "Un mundo de pequeños detalles",
  collections_title: "Descubrí nuestras colecciones",

  services: [
    {
      title: "Velas artesanales",
      description:
        "Pequeñas creaciones para llenar tus espacios de calidez.",
      image:
        "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600",
      category: "Velas",
    },
    {
      title: "Decoración en yeso",
      description:
        "Piezas delicadas que aportan encanto a cada rincón.",
      image:
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600",
      category: "Yeso",
    },
    {
      title: "Detalles especiales",
      description:
        "Objetos únicos para regalar y sorprender.",
      image:
        "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=600",
      category: "Todos",
    },
    {
      title: "Hecho con amor",
      description:
        "Cada pieza está preparada con dedicación y cuidado.",
      image:
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600",
      category: "Todos",
    },
  ],

  about_eyebrow: "Nuestra esencia",
  about_title: "Más que objetos,",
  about_highlight: "pequeños momentos.",
  about_description:
    "En Lindos Detalles creemos que son las pequeñas cosas las que hacen especiales nuestros espacios. Creamos velas artesanales y piezas decorativas con dedicación, pensando en quienes disfrutan de los detalles únicos.",
  about_button: "Conocé nuestra historia →",
  about_image:
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000",

  banner_eyebrow: "Lindos Detalles",
  banner_title: "Un detalle especial puede cambiarlo todo.",
  banner_button: "Encontrá el tuyo →",
  banner_image:
    "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=1600",

  footer_tagline: "Hecho con amor",
  footer_description:
    "Pequeñas creaciones para hacer especiales tus momentos.",
  footer_attention_title: "Atención",
  footer_shipping: "Envíos",
  footer_pickup: "Retiro",
  footer_contact: "Compras y consultas",
  footer_social_title: "Seguinos",
  footer_social_label: "Instagram",
  footer_copyright:
    "© 2026 Lindos Detalles. Todos los derechos reservados.",
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [category, setCategory] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [content, setContent] =
    useState<SiteContent>(defaultSiteContent);

  // CARGAR PRODUCTOS
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

  // CARGAR PERSONALIZACIÓN DE LA TIENDA
  useEffect(() => {
    async function loadSiteContent() {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Error cargando la personalización:", error);
        return;
      }

      if (data?.content) {
        const savedContent = data.content as Partial<SiteContent>;

        setContent({
          ...defaultSiteContent,
          ...savedContent,
          services:
            Array.isArray(savedContent.services) &&
            savedContent.services.length > 0
              ? savedContent.services
              : defaultSiteContent.services,
        });
      }
    }

    loadSiteContent();
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
    <main className="min-h-screen bg-[#F8F5EE] text-[#39342f]">

      {/* ENCABEZADO */}
      <header className="sticky top-0 z-40 bg-[#F8F5EE]/95 backdrop-blur-md border-b border-[#e8dfd3]">
        <div className="max-w-7xl mx-auto px-5 md:px-12 h-20 flex items-center justify-between gap-4">

          <a href="#inicio" className="shrink-0">
            <span className="font-serif text-xl md:text-3xl tracking-[0.12em]">
              LINDOS DETALLES
            </span>
            <span className="block text-[8px] tracking-[0.4em] uppercase text-[#9b8873] text-center mt-1">
              {content.footer_tagline}
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-[10px] tracking-[0.2em] uppercase text-[#756b60]">
            <a href="#inicio" className="hover:text-[#ad987e] transition">Inicio</a>
            <a href="#productos" className="hover:text-[#ad987e] transition">Tienda</a>
            <a href="#nosotros" className="hover:text-[#ad987e] transition">Nosotros</a>
            <a href="#contacto" className="hover:text-[#ad987e] transition">Contacto</a>
          </nav>

          <button
            onClick={() => setShowCart(true)}
            className="shrink-0 border border-[#cbbba6] px-4 py-3 text-[10px] tracking-[0.15em] uppercase hover:bg-[#eadcc8] transition"
          >
            Bolsa ({cart.length})
          </button>
        </div>
      </header>

      {/* PORTADA PRINCIPAL */}
      <section id="inicio" className="relative min-h-[540px] md:min-h-[650px] flex items-center overflow-hidden">

        <img
          src={content.hero_image || heroImage}
          alt="Ambiente cálido de decoración"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#514438]/70 via-[#514438]/35 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-7 md:px-16 py-24">
          <div className="max-w-xl text-white">

            <p className="text-[10px] tracking-[0.35em] uppercase mb-6 text-[#f1e3d1]">
              {content.hero_eyebrow}
            </p>

            <h1 className="font-serif text-5xl md:text-7xl leading-[1.1]">
              {content.hero_title}
              <span className="block italic text-[#ead6bd]">
                {content.hero_highlight}
              </span>
            </h1>

            <p className="text-sm md:text-base leading-7 text-white/90 max-w-md mt-7">
              {content.hero_description}
            </p>

            <a
              href="#productos"
              className="inline-block mt-9 bg-[#eadcc8] text-[#514438] px-9 py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-white transition"
            >
              {content.hero_button}
            </a>

          </div>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section id="productos" className="max-w-7xl mx-auto px-5 md:px-12 py-16 md:py-24">

        <div className="text-center mb-10 md:mb-14">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#a18b70] mb-4">
            Seleccionados con amor
          </p>
          <h2 className="font-serif text-3xl md:text-5xl">
            Nuestros productos
          </h2>
          <p className="text-xs md:text-sm text-[#897f73] mt-4">
            Encontrá ese detalle especial que estabas buscando.
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          {["Todos", "Velas", "Yeso"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-3 text-[9px] tracking-[0.2em] uppercase border transition ${
                category === cat
                  ? "bg-[#9d8368] text-white border-[#9d8368]"
                  : "border-[#d8cbbb] text-[#756b60] hover:bg-[#eee5d9]"
              }`}
            >
              {cat === "Yeso" ? "Decoración en yeso" : cat}
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

              <div className="aspect-[4/5] overflow-hidden bg-[#eee5d9] mb-4">
                <img
                  src={product.image_url || fallbackImage}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
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
                className="w-full border border-[#ad987e] py-3 text-[9px] tracking-[0.15em] uppercase hover:bg-[#9d8368] hover:text-white transition"
              >
                Agregar a la bolsa
              </button>

            </article>
          ))}

        </div>
      </section>

      {/* NUESTRA ESENCIA */}
      <section id="nosotros" className="bg-[#eee5d9]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 items-center">

          <div className="px-7 md:px-16 py-16 md:py-24">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#a18b70] mb-5">
              {content.about_eyebrow}
            </p>

            <h2 className="font-serif text-3xl md:text-5xl leading-tight">
              {content.about_title}
              <span className="block italic text-[#9d8368]">
                {content.about_highlight}
              </span>
            </h2>

            <p className="text-sm leading-7 text-[#756c61] mt-7">
              {content.about_description}
            </p>

            <a
              href="https://www.instagram.com/lindosdetalles_uy/"
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-8 bg-[#9d8368] text-white px-7 py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-[#806b55] transition"
            >
              {content.about_button}
            </a>
          </div>

          <div className="h-[350px] md:h-[580px]">
            <img
              src={content.about_image || fallbackImage}
              alt="Decoración cálida y natural"
              className="w-full h-full object-cover"
            />
          </div>

        </div>
      </section>

      {/* BANNER FINAL */}
      <section className="relative min-h-[330px] md:min-h-[400px] flex items-center overflow-hidden">

        <img
          src={content.banner_image || fallbackImage}
          alt="Detalles decorativos y velas"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-[#514438]/45" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-7 md:px-16 py-20 text-white">
          <p className="text-[10px] tracking-[0.3em] uppercase mb-5">
            {content.banner_eyebrow}
          </p>

          <h2 className="font-serif text-4xl md:text-6xl max-w-xl leading-tight">
            {content.banner_title}
          </h2>

          <a
            href="#productos"
            className="inline-block mt-8 bg-[#eadcc8] text-[#514438] px-8 py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-white transition"
          >
            {content.banner_button}
          </a>
        </div>
      </section>

      {/* PIE DE PÁGINA */}
      <footer id="contacto" className="bg-[#F1E9DE] px-6 md:px-12 pt-14 pb-8">

        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">

          <div className="col-span-2 md:col-span-1">
            <h2 className="font-serif text-xl tracking-[0.12em]">
              LINDOS DETALLES
            </h2>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[#9b8873] mt-2">
              {content.footer_tagline}
            </p>
            <p className="text-xs text-[#897f73] leading-6 mt-5">
              {content.footer_description}
            </p>
          </div>

          <div>
            <h3 className="text-[10px] tracking-[0.2em] uppercase mb-5">
              Navegación
            </h3>
            <div className="flex flex-col gap-3 text-xs text-[#756b60]">
              <a href="#inicio">Inicio</a>
              <a href="#productos">Tienda</a>
              <a href="#nosotros">Nosotros</a>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] tracking-[0.2em] uppercase mb-5">
              {content.footer_attention_title}
            </h3>
            <div className="flex flex-col gap-3 text-xs text-[#756b60]">
              <span>{content.footer_shipping}</span>
              <span>{content.footer_pickup}</span>
              <span>{content.footer_contact}</span>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] tracking-[0.2em] uppercase mb-5">
              {content.footer_social_title}
            </h3>
            <a
              href="https://www.instagram.com/lindosdetalles_uy/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#756b60] underline underline-offset-4"
            >
              {content.footer_social_label}
            </a>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-[#ded2c3] mt-12 pt-6 text-center">
          <p className="text-[9px] text-[#a59b8e]">
            {content.footer_copyright}
          </p>
        </div>

      </footer>

      {/* CARRITO */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">

          <div className="bg-[#F8F5EE] w-full max-w-md h-full p-6 md:p-8 overflow-y-auto">

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
                aria-label="Cerrar carrito"
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
                  className="w-full bg-[#9d8368] text-white py-4 mt-8 text-[10px] tracking-[0.2em] uppercase hover:bg-[#806b55] transition"
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
