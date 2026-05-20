type CreateShipdayOrderInput = {
  orderId: string;
  customerName: string;
  customerPhoneNumber: string;
  customerAddress: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhoneNumber?: string | null;
  orderItems: Array<{
    name: string;
    quantity: number;
    unitPrice?: number;
  }>;
  totalAmount: string;
  deliveryFee?: string | null;
};

export type ShipdayOrderResult = {
  raw: unknown;
  providerOrderId: string | null;
  trackingId: string | null;
  trackingUrl: string | null;
  driverName: string | null;
  driverPhone: string | null;
  eta: string | null;
};

const SHIPDAY_API_BASE_URL = process.env.SHIPDAY_API_BASE_URL || "https://api.shipday.com";

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function pickFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    const parsed = readString(value);
    if (parsed) return parsed;
  }
  return null;
}

export async function createShipdayOrder(input: CreateShipdayOrderInput): Promise<ShipdayOrderResult> {
  const apiKey = process.env.SHIPDAY_API_KEY;
  if (!apiKey) {
    throw new Error("SHIPDAY_API_KEY is not configured.");
  }

  // Use current time in HH:mm:ss format — Shipday requires this exact format.
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const expectedPickupTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const payload = {
    // Shipday requires alphanumeric orderNumber — strip UUID hyphens
    orderNumber: input.orderId.replace(/-/g, ""),
    customerName: input.customerName,
    customerPhoneNumber: input.customerPhoneNumber,
    customerAddress: input.customerAddress,
    restaurantName: input.restaurantName,
    restaurantAddress: input.restaurantAddress,
    restaurantPhoneNumber: input.restaurantPhoneNumber || undefined,
    orderItem: input.orderItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    totalOrderCost: Number.parseFloat(input.totalAmount),
    deliveryFee: input.deliveryFee ? Number.parseFloat(input.deliveryFee) : 0,
    autoAssign: true,
    expectedPickupTime,
  };

  const response = await fetch(`${SHIPDAY_API_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await response.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  const data = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;

  // Shipday returns HTTP 200 with success:false on logical errors,
  // and HTTP 400 with empty body {} on bad request (e.g. invalid orderNumber).
  if (!response.ok || data.success === false) {
    const message =
      (typeof data.message === "string" && data.message) ||
      (typeof data.error === "string" && data.error) ||
      (typeof data.response === "string" && data.response) ||
      `Shipday order creation failed (HTTP ${response.status}).`;

    console.error("[Shipday] Create order failed", {
      status: response.status,
      body: json,
      sentOrderNumber: payload.orderNumber,
      sentRestaurant: payload.restaurantName,
      sentAddress: payload.customerAddress,
    });
    throw new Error(String(message));
  }

  const result = {
    raw: data,
    providerOrderId: pickFirstString(
      data.orderId,
      data.id,
      data.orderID,
      data.orderNumber,
      (data.order as any)?.orderId,
      (data.order as any)?.id,
      (data.order as any)?.orderNumber,
    ),
    trackingId: pickFirstString(data.trackingId, data.trackingID, data.tracking_id),
    trackingUrl: pickFirstString(data.trackingUrl, data.trackingURL, data.tracking_url),
    driverName: pickFirstString(data.driverName, data.driver_name),
    driverPhone: pickFirstString(data.driverPhone, data.driver_phone),
    eta: pickFirstString(data.eta, data.estimatedDeliveryTime, data.estimatedArrival),
  };

  if (!result.providerOrderId) {
    console.warn(
      "[createShipdayOrder] WARNING: providerOrderId is null. " +
      "Shipday response keys: " + Object.keys(data).join(", ") +
      " Full response: " + JSON.stringify(data)
    );
  }
  return result;
}
