import { NextRequest, NextResponse } from "next/server";
import { getResolvedIdentity } from "@/lib/reveal/resolve";
import type { ApiResponse, ResolvedIdentity } from "@/types/reveal";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ens = searchParams.get("ens");
    const address = searchParams.get("address");

    if (!ens && !address) {
      return NextResponse.json(
        {
          ok: false,
          error: "Either 'ens' or 'address' query parameter is required",
        } satisfies ApiResponse<ResolvedIdentity>,
        { status: 400 },
      );
    }

    const identity = await getResolvedIdentity({ ens, address });

    return NextResponse.json({
      ok: true,
      data: identity,
    } satisfies ApiResponse<ResolvedIdentity>);
  } catch (error: any) {
    console.error("Error in /api/reveal/resolve:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Failed to resolve identity",
      } satisfies ApiResponse<ResolvedIdentity>,
      { status: 500 },
    );
  }
}
