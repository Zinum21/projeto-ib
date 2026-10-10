import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { sameOrigin } from "@/lib/http";
import { validSession, cookieName } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  if (!validSession(req.cookies.get(cookieName)?.value))
    return NextResponse.json(
      { error: "Entre para acessar seus dados." },
      { status: 401 },
    );
  return NextResponse.json(store().state(), {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  if (!validSession(req.cookies.get(cookieName)?.value))
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const raw = await req.text();
    if (raw.length > 1000000) throw new Error("Solicitação muito grande.");
    const body = JSON.parse(raw);
    return NextResponse.json(
      store().mutate(body.action, body.kind, body.values, body.id),
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Não foi possível salvar." },
      { status: 400 },
    );
  }
}
