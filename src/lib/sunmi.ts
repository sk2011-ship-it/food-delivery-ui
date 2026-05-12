import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { menuItems, orderItems, orders, restaurants } from "@/lib/db/schema";

const SUNMI_BASE_URL = "https://cloud.sunmi.com";

export type SunmiFormValue = string | number | boolean | null | undefined;

export type SunmiReceiptLine =
  | { type: "text"; value: string }
  | { type: "divider" }
  | { type: "blank" };

export interface SunmiReceiptData {
  orderId: string;
  restaurantName: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
  customerPhone: string | null;
  deliveryAddress: string | null;
  deliveryArea: string | null;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
}

export interface SunmiPrinterBinding {
  restaurantId: string;
  shopId: string;
  printerMsn: string;
}

function requireSunmiConfig() {
  const appId = process.env.SUNMI_APP_ID?.trim();
  const appKey = process.env.SUNMI_APP_KEY?.trim();

  if (!appId || !appKey) {
    throw new Error("Missing SUNMI_APP_ID or SUNMI_APP_KEY.");
  }

  return { appId, appKey };
}

export function buildSunmiSignature(params: Record<string, SunmiFormValue>, appKey: string) {
  const sorted = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && `${params[key]}` !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto.createHash("md5").update(sorted + appKey).digest("hex").toUpperCase();
}

export function encodeFormBody(params: Record<string, SunmiFormValue>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    searchParams.set(key, String(value));
  }

  return searchParams.toString();
}

async function callSunmi<T>(path: string, params: Record<string, SunmiFormValue>) {
  const { appId, appKey } = requireSunmiConfig();
  const bodyParams = { app_id: appId, ...params };
  const sign = buildSunmiSignature(bodyParams, appKey);
  const body = encodeFormBody({ ...bodyParams, sign });

  const res = await fetch(`${SUNMI_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await res.text();
  let data: T | null = null;

  try {
    data = text ? (JSON.parse(text) as T) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(`Sunmi request failed (${res.status}): ${text || "empty response"}`);
  }

  return data;
}

export const sunmiClient = {
  bindPrinter(payload: SunmiPrinterBinding & { timestamp?: string | number }) {
    return callSunmi("/v2/printer/bind", {
      msn: payload.printerMsn,
      shop_id: payload.shopId,
      timestamp: payload.timestamp ?? Date.now(),
    });
  },
  pushPrinter(payload: SunmiPrinterBinding & { orderId: string; timestamp?: string | number }) {
    return callSunmi("/v2/printer/push", {
      msn: payload.printerMsn,
      shop_id: payload.shopId,
      order_id: payload.orderId,
      timestamp: payload.timestamp ?? Date.now(),
    });
  },
  getStatus(payload: SunmiPrinterBinding & { timestamp?: string | number }) {
    return callSunmi("/v2/printer/status", {
      msn: payload.printerMsn,
      shop_id: payload.shopId,
      timestamp: payload.timestamp ?? Date.now(),
    });
  },
  unbindPrinter(payload: SunmiPrinterBinding & { timestamp?: string | number }) {
    return callSunmi("/v2/printer/unbind", {
      msn: payload.printerMsn,
      shop_id: payload.shopId,
      timestamp: payload.timestamp ?? Date.now(),
    });
  },
};

export function buildSunmiReceiptLines(order: SunmiReceiptData): SunmiReceiptLine[] {
  const lines: SunmiReceiptLine[] = [
    { type: "text", value: "KITCHEN RECEIPT" },
    { type: "divider" },
    { type: "text", value: `Order: ${order.orderId}` },
    { type: "text", value: `Restaurant: ${order.restaurantName}` },
    { type: "text", value: `Time: ${order.createdAt}` },
    { type: "text", value: `Currency: ${order.currency}` },
    { type: "blank" },
    { type: "text", value: "Items:" },
  ];

  for (const item of order.items) {
    lines.push({
      type: "text",
      value: `${item.quantity}x ${item.name} - ${item.price}`,
    });
  }

  lines.push(
    { type: "divider" },
    { type: "text", value: `Total: ${order.currency} ${order.totalAmount}` },
    { type: "text", value: order.deliveryAddress ? `Address: ${order.deliveryAddress}` : "Address: N/A" },
    { type: "text", value: order.deliveryArea ? `Area: ${order.deliveryArea}` : "Area: N/A" },
    { type: "text", value: order.customerPhone ? `Phone: ${order.customerPhone}` : "Phone: N/A" },
    { type: "blank" }
  );

  return lines;
}

export function buildEscPosReceipt(order: SunmiReceiptData) {
  const ESC = "\x1b";
  const GS = "\x1d";
  const lines = buildSunmiReceiptLines(order);

  let receipt = "";
  receipt += ESC + "@"; // initialize printer
  receipt += ESC + "!" + "\x30";
  receipt += "KITCHEN RECEIPT\n";
  receipt += ESC + "!" + "\x00";
  receipt += "------------------------------\n";

  for (const line of lines) {
    if (line.type === "divider") {
      receipt += "------------------------------\n";
      continue;
    }
    if (line.type === "blank") {
      receipt += "\n";
      continue;
    }
    receipt += `${line.value}\n`;
  }

  receipt += GS + "V" + "\x41" + "\x00";
  return receipt;
}

export async function getSunmiReceiptData(orderId: string): Promise<SunmiReceiptData | null> {
  const [order] = await db
    .select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      currency: orders.currency,
      deliveryAddress: orders.deliveryAddress,
      deliveryArea: orders.deliveryArea,
      customerPhone: orders.customerPhone,
      createdAt: orders.createdAt,
      restaurantNameSnapshot: orders.restaurantNameSnapshot,
      restaurantName: restaurants.name,
    })
    .from(orders)
    .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select({
      name: menuItems.name,
      quantity: orderItems.quantity,
      price: orderItems.price,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId));

  return {
    orderId: order.id,
    restaurantName: order.restaurantNameSnapshot ?? order.restaurantName,
    totalAmount: String(order.totalAmount),
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    customerPhone: order.customerPhone ?? null,
    deliveryAddress: order.deliveryAddress ?? null,
    deliveryArea: order.deliveryArea ?? null,
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: String(item.price),
    })),
  };
}
