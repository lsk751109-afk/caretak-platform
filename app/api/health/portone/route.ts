import { NextResponse } from "next/server";

export async function GET() {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
  const apiSecret = process.env.PORTONE_API_SECRET;

  return NextResponse.json({
    configured: Boolean(storeId && channelKey && apiSecret),
    browserConfigured: Boolean(storeId && channelKey),
    serverConfigured: Boolean(apiSecret),
    storeIdPrefix: storeId ? storeId.slice(0, 12) : null,
    channelKeyPrefix: channelKey ? channelKey.slice(0, 16) : null,
  });
}
