import { NextResponse } from "next/server";
import { buildEscPosReceipt, buildSunmiWelcomeSlip, getSunmiReceiptData } from "@/lib/sunmi";

function readOrderId(req: Request) {
  const url = new URL(req.url);
  return url.searchParams.get("orderId");
}

export async function GET(req: Request) {
  const orderId = readOrderId(req);

  if (!orderId) {
    return NextResponse.json({
      code: 1,
      data: {
        orderIdList: [],
      },
    });
  }

  if (orderId.startsWith("welcome:")) {
    const parts = orderId.split(":");
    const restaurantName = decodeURIComponent(parts[1] || "Kilkeel Eats");
    const shopId = decodeURIComponent(parts[2] || "restaurant_001");
    const printerMsn = decodeURIComponent(parts[3] || "unknown");
    const content = buildSunmiWelcomeSlip({
      restaurantName,
      shopId,
      printerMsn,
    });

    return NextResponse.json({
      code: 1,
      data: {
        content,
        isPrint: 0,
      },
    });
  }

  const receipt = await getSunmiReceiptData(orderId);
  if (!receipt) {
    return NextResponse.json(
      {
        code: 0,
        message: "Order not found.",
      },
      { status: 404 }
    );
  }

  const content = buildEscPosReceipt(receipt);
  return NextResponse.json({
    code: 1,
    data: {
      content,
      isPrint: 0,
    },
  });
}
