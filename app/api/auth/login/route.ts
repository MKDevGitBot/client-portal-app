import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// Simple in-memory rate limiter
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return ip;
}

function checkRateLimit(key: string): { limited: boolean; remaining: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, remaining: MAX_ATTEMPTS - 1 };
  }

  entry.count++;
  if (entry.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, remaining: 0 };
  }

  return { limited: false, remaining: MAX_ATTEMPTS - entry.count };
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateKey = getRateLimitKey(request);
    const { limited, remaining } = checkRateLimit(rateKey);

    if (limited) {
      return NextResponse.json(
        {
          error:
            "Zu viele Anmeldeversuche. Bitte warte 15 Minuten und versuche es erneut.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "900",
          },
        }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-Mail und Passwort erforderlich" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        {
          error:
            "Ungültige Anmeldedaten — E-Mail oder Passwort ist falsch.",
        },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        {
          error:
            "Ungültige Anmeldedaten — E-Mail oder Passwort ist falsch.",
        },
        { status: 401 }
      );
    }

    await createSession(user.id);
    await logActivity(user.id, "LOGIN", "User", user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Serverfehler — Bitte versuche es später erneut." },
      { status: 500 }
    );
  }
}
