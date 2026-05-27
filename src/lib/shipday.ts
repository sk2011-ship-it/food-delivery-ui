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
    autoAssign: false,
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

// ── Driver (Carrier) Management ──────────────────────────────────────────────

export type ShipdayCarrier = {
  carrierId: number;
  name: string;
  email: string;
  phoneNumber: string;
  isOnShift: boolean;
  isActive: boolean;
  /** Real-time GPS location if Shipday is broadcasting it */
  lastLocation: { lat: number; lng: number } | null;
};

/**
 * Creates a driver account in Shipday.
 * Shipday auto-generates a temporary password returned in the response.
 * POST https://api.shipday.com/carriers
 */
export async function createShipdayCarrier(input: {
  name: string;
  email: string;
  phoneNumber: string;
}): Promise<{ carrierId: number; email: string; password: string }> {
  const apiKey = process.env.SHIPDAY_API_KEY;
  if (!apiKey) throw new Error("SHIPDAY_API_KEY is not configured.");

  const response = await fetch(`${SHIPDAY_API_BASE_URL}/carriers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const text = await response.text();
  let json: Record<string, unknown> = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }

  if (!response.ok) {
    const msg = (typeof json.message === "string" && json.message) ||
      (typeof json.error === "string" && json.error) ||
      `Shipday carrier creation failed (HTTP ${response.status}).`;
    console.error("[Shipday] createCarrier failed", { status: response.status, body: json });
    throw new Error(msg);
  }

  return {
    carrierId: json.carrierId as number,
    email: json.email as string,
    password: json.password as string,
  };
}

/**
 * Cancels / deletes a delivery order from Shipday.
 * Called when the customer or owner cancels an order so Shipday doesn't
 * keep dispatching a driver for an order that no longer exists.
 * DELETE https://api.shipday.com/orders/{orderId}
 */
export async function cancelShipdayOrder(providerOrderId: string | number): Promise<void> {
  const apiKey = process.env.SHIPDAY_API_KEY;
  if (!apiKey) throw new Error("SHIPDAY_API_KEY is not configured.");

  const response = await fetch(`${SHIPDAY_API_BASE_URL}/orders/${providerOrderId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    cache: "no-store",
  });

  // 404 = already gone from Shipday — treat as success
  if (!response.ok && response.status !== 404) {
    throw new Error(`Shipday cancelOrder failed (HTTP ${response.status}).`);
  }
}

/**
 * Deletes a driver account from Shipday.
 * DELETE https://api.shipday.com/carriers/{carrierId}
 */
export async function deleteShipdayCarrier(carrierId: string | number): Promise<void> {
  const apiKey = process.env.SHIPDAY_API_KEY;
  if (!apiKey) throw new Error("SHIPDAY_API_KEY is not configured.");

  const response = await fetch(`${SHIPDAY_API_BASE_URL}/carriers/${carrierId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Shipday deleteCarrier failed (HTTP ${response.status}).`);
  }
}

/**
 * Lists all driver accounts from Shipday.
 * GET https://api.shipday.com/carriers
 */
export async function listShipdayCarriers(): Promise<ShipdayCarrier[]> {
  const apiKey = process.env.SHIPDAY_API_KEY;
  if (!apiKey) throw new Error("SHIPDAY_API_KEY is not configured.");

  const response = await fetch(`${SHIPDAY_API_BASE_URL}/carriers`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    cache: "no-store",
  });

  const text = await response.text();
  let json: unknown = [];
  try { json = text ? JSON.parse(text) : []; } catch { json = []; }

  if (!response.ok) {
    throw new Error(`Shipday listCarriers failed (HTTP ${response.status}).`);
  }

  const arr = Array.isArray(json)
    ? json
    : ((json as Record<string, unknown>).carriers ?? (json as Record<string, unknown>).data ?? []) as unknown[];

  return (arr as Record<string, unknown>[]).map((c) => ({
    // Shipday GET /carriers uses "id" as the primary key, not "carrierId"
    carrierId: (c.id ?? c.carrierId ?? c.carrier_id ?? c.driverId ?? c.driver_id) as number,
    name: (c.name ?? c.driverName ?? c.driver_name ?? "") as string,
    email: (c.email ?? "") as string,
    phoneNumber: (c.phoneNumber ?? c.phone ?? c.phone_number ?? "") as string,
    // isOnShift is the documented boolean field on GET /carriers
    isOnShift: Boolean(c.isOnShift ?? c.is_on_shift),
    isActive: Boolean(c.isActive ?? c.is_active),
    lastLocation: (() => {
      const loc = c.lastLocation ?? c.last_location ?? c.location ?? c.currentLocation;
      if (loc && typeof loc === "object") {
        const l = loc as Record<string, unknown>;
        const lat = Number(l.latitude ?? l.lat);
        const lng = Number(l.longitude ?? l.lng ?? l.lon);
        if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) return { lat, lng };
      }
      return null;
    })(),
  }));
}

/**
 * Assigns a specific Shipday carrier (driver) to an existing Shipday order.
 * POST https://api.shipday.com/orders/{providerOrderId}/assign/{carrierId}
 */
export async function assignShipdayCarrierToOrder(
  providerOrderId: string | number,
  carrierId: number
): Promise<void> {
  const apiKey = process.env.SHIPDAY_API_KEY;
  if (!apiKey) throw new Error("SHIPDAY_API_KEY is not configured.");

  const response = await fetch(
    `${SHIPDAY_API_BASE_URL}/orders/assign/${providerOrderId}/${carrierId}?dispatch=true`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Shipday assignCarrier failed (HTTP ${response.status}): ${text}`);
  }
  console.log(`[Shipday] Carrier ${carrierId} assigned to Shipday order ${providerOrderId}`);
}

/**
 * Marks a Shipday order as ready to be picked up.
 * This is often required for the order to appear in the driver's mobile app.
 * PUT https://api.shipday.com/orders/ready/{orderId}
 */
export async function markShipdayOrderAsReady(
  providerOrderId: string | number
): Promise<void> {
  const apiKey = process.env.SHIPDAY_API_KEY;
  if (!apiKey) throw new Error("SHIPDAY_API_KEY is not configured.");

  const response = await fetch(
    `${SHIPDAY_API_BASE_URL}/orders/ready/${providerOrderId}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.warn(`[Shipday] markOrderAsReady failed (HTTP ${response.status}). The driver might still see it if assigned.`);
  } else {
    console.log(`[Shipday] Order ${providerOrderId} marked as READY for pickup.`);
  }
}

/**
 * Manually starts/dispatches a Shipday order.
 * This can force the order into the "Started" state, ensuring it stays active in the driver app.
 * PUT https://api.shipday.com/orders/edit-status/{orderId}
 */
export async function startShipdayOrder(
  providerOrderId: string | number
): Promise<void> {
  const apiKey = process.env.SHIPDAY_API_KEY;
  if (!apiKey) throw new Error("SHIPDAY_API_KEY is not configured.");

  const response = await fetch(
    `${SHIPDAY_API_BASE_URL}/orders/edit-status/${providerOrderId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({ status: "STARTED" }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.warn(`[Shipday] startOrder (edit-status) failed (HTTP ${response.status}).`);
  } else {
    console.log(`[Shipday] Order ${providerOrderId} forced to STARTED state.`);
  }
}
