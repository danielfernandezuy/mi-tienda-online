
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";


export async function POST(request: Request) {
  try {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!secret || !token) {
      console.error("Faltan variables de Mercado Pago.");
      return NextResponse.json(
        { error: "Configuración incompleta." },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const dataId = url.searchParams.get("data.id");
    const requestId = request.headers.get("x-request-id");
    const signature = request.headers.get("x-signature");

    if (!dataId || !requestId || !signature) {
      return NextResponse.json(
        { error: "Notificación incompleta." },
        { status: 401 }
      );
    }

    const parts = new Map(
      signature.split(",").map((part) => {
        const [key, value] = part.trim().split("=");
        return [key, value];
      })
    );

    const timestamp = parts.get("ts");
    const receivedHash = parts.get("v1");

    if (!timestamp || !receivedHash || !/^[a-f0-9]{64}$/i.test(receivedHash)) {
      return NextResponse.json(
        { error: "Firma inválida." },
        { status: 401 }
      );
    }

    const manifest =
      `id:${dataId};request-id:${requestId};ts:${timestamp};`;

    const calculatedHash = createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");

    const receivedBuffer = Buffer.from(receivedHash, "hex");
    const calculatedBuffer = Buffer.from(calculatedHash, "hex");

    if (
      receivedBuffer.length !== calculatedBuffer.length ||
      !timingSafeEqual(receivedBuffer, calculatedBuffer)
    ) {
      return NextResponse.json(
        { error: "Firma no autorizada." },
        { status: 401 }
      );
    }

    const notification = await request.json();

    if (
      notification?.type !== "order" ||
      notification?.data?.id !== dataId
    ) {
      return NextResponse.json({ received: true });
    }

    // Consultamos la orden directamente en Mercado Pago.
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/orders/${encodeURIComponent(dataId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!mpResponse.ok) {
      console.error("No pudimos consultar la orden en Mercado Pago.");
      return NextResponse.json(
        { error: "No pudimos verificar el pago." },
        { status: 502 }
      );
    }

    const mpOrder = await mpResponse.json();

    // Comprobamos que la orden corresponda a nuestra tienda.
    if (
      mpOrder.id !== dataId ||
      !mpOrder.external_reference
    ) {
      return NextResponse.json({ received: true });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", mpOrder.external_reference)
      .eq("mp_order_id", mpOrder.id)
      .eq("payment_method", "mercado_pago")
      .maybeSingle();

    if (orderError) {
      console.error("Error consultando el pedido:", orderError);
      return NextResponse.json(
        { error: "No pudimos consultar el pedido." },
        { status: 500 }
      );
    }

    if (!order) {
      console.error("La orden no corresponde a un pedido registrado.");
      return NextResponse.json({ received: true });
    }

    // Verificamos moneda e importes antes de actualizar.
    const expectedAmount = Math.round(Number(order.total_amount) * 100);
    const orderAmount = Math.round(Number(mpOrder.total_amount) * 100);
    const paidAmount = Math.round(Number(mpOrder.total_paid_amount) * 100);

    if (
      mpOrder.currency_id !== "UYU" ||
      !Number.isFinite(expectedAmount) ||
      expectedAmount !== orderAmount
    ) {
      console.error("El importe o la moneda no coinciden.");
      return NextResponse.json(
        { error: "Los datos del pago no coinciden." },
        { status: 409 }
      );
    }

    let newPaymentStatus: string | null = null;

    if (
      mpOrder.status === "processed" &&
      mpOrder.status_detail === "accredited" &&
      paidAmount === expectedAmount
    ) {
      newPaymentStatus = "paid";
    } else if (mpOrder.status === "refunded") {
      newPaymentStatus = "refunded";
    }

    if (newPaymentStatus) {
      // Evitamos que una notificación antigua cambie
      // un pedido reembolsado nuevamente a pagado.
      if (
        !(order.payment_status === "refunded" && newPaymentStatus === "paid")
      ) {
        const { error: updateError } = await supabaseAdmin
          .from("orders")
          .update({ payment_status: newPaymentStatus })
          .eq("id", order.id)
          .eq("mp_order_id", mpOrder.id);

        if (updateError) {
          console.error("Error actualizando el pago:", updateError);
          return NextResponse.json(
            { error: "No pudimos actualizar el pedido." },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Error en webhook de Mercado Pago:", error);

    return NextResponse.json(
      { error: "Error procesando la notificación." },
      { status: 500 }
    );
  }
}
