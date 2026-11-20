
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Pedido inválido." },
        { status: 400 }
      );
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!token) {
      throw new Error("Falta configurar el token de Mercado Pago.");
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "No encontramos el pedido." },
        { status: 404 }
      );
    }

    if (order.payment_method !== "mercado_pago") {
      return NextResponse.json(
        { error: "Método de pago incorrecto." },
        { status: 400 }
      );
    }

    if (order.payment_status !== "pending") {
      return NextResponse.json(
        { error: "El pedido ya no está pendiente." },
        { status: 400 }
      );
    }

    if (!order.customer_email) {
      return NextResponse.json(
        { error: "Se necesita un correo electrónico para pagar." },
        { status: 400 }
      );
    }

const savedItems = order.items as Array<{
  name: string;
  price: number;
  quantity: number;
  product_id: string;
  color: string | null;
  size: string | null;
}>;


    if (!savedItems?.length) {
      return NextResponse.json(
        { error: "El pedido no contiene productos." },
        { status: 400 }
      );
    }

  const items = savedItems.map((item) => ({
  title: `${item.name}${item.color ? ` - ${item.color}` : ""}${item.size ? ` - ${item.size}` : ""}`,
  quantity: item.quantity,
  unit_price: item.price.toFixed(2),
}));

    const total = savedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (total !== order.total_amount || total <= 0) {
      return NextResponse.json(
        { error: "El total del pedido no coincide." },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.mercadopago.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify({
          type: "online",
          processing_mode: "manual",
          capture_mode: "automatic_async",
          total_amount: total.toFixed(2),
          external_reference: order.id,
          payer: {
            email: order.customer_email,
          },
          items,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago:", result);

      return NextResponse.json(
        { error: "Mercado Pago no pudo crear el pago." },
        { status: 502 }
      );
    }

    await supabaseAdmin
      .from("orders")
      .update({ mp_order_id: result.id })
      .eq("id", order.id);

    return NextResponse.json({
      checkout_url: result.checkout_url,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No pudimos iniciar el pago." },
      { status: 500 }
    );
  }
}
