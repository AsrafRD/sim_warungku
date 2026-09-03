import crypto from "crypto";

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items?: MidtransItemDetail[];
}

export function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || process.env.MIDTRANS_CLIENT_KEY || "";
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  const snapUrl = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const snapJsUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return {
    serverKey,
    clientKey,
    isProduction,
    snapUrl,
    snapJsUrl,
  };
}

export async function createSnapTransaction(params: CreateSnapTransactionParams): Promise<{
  token: string;
  redirect_url: string;
}> {
  const config = getMidtransConfig();

  if (!config.serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi di environment (.env)");
  }

  const authHeader = "Basic " + Buffer.from(`${config.serverKey}:`).toString("base64");

  const payload = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || "",
    },
    item_details: params.items && params.items.length > 0
      ? params.items.map((it) => ({
          id: it.id,
          price: Math.round(it.price),
          quantity: it.quantity,
          name: it.name.slice(0, 50),
        }))
      : undefined,
  };

  const res = await fetch(config.snapUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[Midtrans createSnapTransaction Error]", res.status, errorText);
    throw new Error(`Gagal membuat transaksi Midtrans: ${errorText}`);
  }

  const data = await res.json();
  return {
    token: data.token,
    redirect_url: data.redirect_url,
  };
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const { serverKey } = getMidtransConfig();
  if (!serverKey) return false;

  const rawString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const calculatedHash = crypto.createHash("sha512").update(rawString).digest("hex");

  return calculatedHash === signatureKey;
}
