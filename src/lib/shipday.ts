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
  return typeof value === "string" && value.trim() ? value.trim() : null;
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

  const payload = {
    orderNumber: input.orderId,
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

  if (!response.ok) {
    let message = `Shipday order creation failed with status ${response.status}.`;
    if (json && typeof json === "object") {
      const j = json as Record<string, unknown>;
      if (typeof j.message === "string") message = j.message;
      else if (typeof j.error === "string") message = j.error;
      else if (typeof j.raw === "string") message = j.raw;
    }

    console.error("[Shipday] Create order failed", {
      status: response.status,
      body: json,
      payload,
    });
    throw new Error(String(message));
  }

  const data = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;

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
      data.orderId !== undefined ? String(data.orderId) : null,
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
