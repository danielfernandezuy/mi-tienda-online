
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ProductVariant = {
  color: string | null;
  size: string | null;
  price: number;
  image_url: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customer_name,
      customer_email,
      customer_phone,
      delivery_method,
      shipping_address,
      customer_notes,
      payment_method,
      items,
    } = body;

    // Validar datos del comprador
    if (
      !customer_name?.trim() ||
      !customer_phone?.trim() ||
      !["shipping", "pickup"].includes(delivery_method) ||
      !["mercado_pago", "bank_transfer"].includes(payment_method) ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 20
    ) {
      return NextResponse.json(
        { error: "Revisá los datos del pedido." },
        { status: 400 }
      );
    }

   if (
  delivery_method === "shipping" &&
  (!shipping_address || !shipping_address.trim())
) {
  return NextResponse.json(
    { error: "Falta la dirección de envío." },
    { status: 400 }
  );
}
      // Validar cantidades, colores y tamaños
      for (const item of items) {
        if (
          typeof item.product_id !== "string" ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 20 ||
          (item.color !== null && item.color !== undefined &&
            typeof item.color !== "string") ||
          (item.size !== null && item.size !== undefined &&
            typeof item.size !== "string")
        ) {
          return NextResponse.json(
            { error: "Hay productos, variantes o cantidades inválidas." },
            { status: 400 }
          );
        }
      }

      const productIds = Array.from(
        new Set(items.map((item: { product_id: string }) => item.product_id))
      );

      // Consultar productos y variantes directamente en Supabase
      const { data: products, error: productsError } =
        await supabaseAdmin
          .from("products")
          .select("id, name, price, image_url, variants")
          .in("id", productIds)
          .eq("active", true);

      if (productsError) {
        console.error(productsError);
        return NextResponse.json(
          { error: "No pudimos verificar los productos." },
          { status: 500 }
        );
      }

      if (!products || products.length !== productIds.length) {
        return NextResponse.json(
          { error: "Uno o más productos ya no están disponibles." },
          { status: 400 }
        );
      }

      const productsMap = new Map(
        products.map((product) => [product.id, product])
      );

      // Verificar cada combinación y calcular su precio real
      const orderItems = [];

      for (const item of items) {
        const product = productsMap.get(item.product_id);

        if (!product) {
          return NextResponse.json(
            { error: "Uno o más productos ya no están disponibles." },
            { status: 400 }
          );
        }

        const variants = (product.variants || []) as ProductVariant[];

        const color = item.color ?? null;
        const size = item.size ?? null;

        let variant: ProductVariant | undefined;

        if (variants.length > 0) {
          variant = variants.find(
            (option) =>
              option.color === color &&
              option.size === size
          );

          if (!variant) {
            return NextResponse.json(
              {
                error: `La variante seleccionada de ${product.name} ya no está disponible.`,
              },
              { status: 400 }
            );
          }
        } else if (color !== null || size !== null) {
          return NextResponse.json(
            {
              error: `El producto ${product.name} no tiene esas variantes.`,
            },
            { status: 400 }
          );
        }

        const price = variant?.price ?? product.price;
        const imageUrl = variant?.image_url || product.image_url;

        orderItems.push({
          product_id: product.id,
          name: product.name,
          color,
          size,
          price,
          quantity: item.quantity,
          subtotal: price * item.quantity,
          image_url: imageUrl,
        });
      }

      const totalAmount = orderItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );



    // Crear pedido
    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .insert({
          customer_name: customer_name.trim(),
          customer_email: customer_email?.trim() || null,
          customer_phone: customer_phone.trim(),
          delivery_method,
          shipping_address:
            delivery_method === "shipping"
              ? shipping_address.trim()
              : null,
          customer_notes: customer_notes?.trim() || null,
          payment_method,
          items: orderItems,
          total_amount: totalAmount,
          status: "pending",
          payment_status: "pending",
        })
        .select("id, total_amount, payment_method, status")
        .single();

    if (orderError) {
      console.error(orderError);
      return NextResponse.json(
        { error: "No pudimos registrar el pedido." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Pedido registrado correctamente.",
        order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ERROR AL CREAR PEDIDO:", error);

    return NextResponse.json(
      { error: "Ocurrió un error al procesar el pedido." },
      { status: 500 }
    );
  }
}

