import { NextResponse } from "next/server";
import { buildEscPosReceipt, getSunmiReceiptData } from "@/lib/sunmi";

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
