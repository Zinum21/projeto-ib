import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { sameOrigin } from "@/lib/http";
import {
  cookieName,
  validSession,
  passwordHash,
  checkPassword,
  issueSession,
} from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      initialized: !!store().meta("password"),
      authenticated: validSession(req.cookies.get(cookieName)?.value),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  try {
    const raw = await req.text();
    if (raw.length > 10000) throw new Error("Solicitação inválida.");
    const { password, action } = JSON.parse(raw),
      db = store();
    if (action === "logout") {
      const res = NextResponse.json({ ok: true });
      res.cookies.delete(cookieName);
      return res;
    }
    if (
      typeof password !== "string" ||
      password.length < 10 ||
      password.length > 128
    )
      throw new Error("Use uma senha entre 10 e 128 caracteres.");
    const existing = db.meta("password");
    if (!existing) {
      if (action !== "setup") throw new Error("Crie a senha primeiro.");
      db.setMeta("password", passwordHash(password));
    } else {
      if (action === "setup") throw new Error("A conta já foi configurada.");
      const fail = JSON.parse(
        db.meta("auth_failures") || '{"count":0,"since":0}',
      );
      if (Date.now() - fail.since > 900000) {
        fail.count = 0;
        fail.since = Date.now();
      }
      if (fail.count >= 5)
        return NextResponse.json(
          { error: "Muitas tentativas. Aguarde 15 minutos." },
          { status: 429 },
        );
      if (!checkPassword(password, existing)) {
        fail.count++;
        db.setMeta("auth_failures", JSON.stringify(fail));
        return NextResponse.json(
          { error: "Senha incorreta." },
          { status: 401 },
        );
      }
      db.setMeta("auth_failures", '{"count":0,"since":0}');
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookieName, issueSession(), {
      httpOnly: true,
      sameSite: "strict",
      secure: req.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 7 * 86400,
    });
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao entrar." },
      { status: 400 },
    );
  }
}
