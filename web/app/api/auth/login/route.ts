import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

type LoginBody = {
  customerId?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginBody | null;

  const customerId = Number.parseInt(String(body?.customerId ?? ""), 10);
  const password = String(body?.password ?? "");

  if (!Number.isInteger(customerId) || customerId <= 0 || !password) {
    return NextResponse.json({ error: "Enter a valid customer ID and password." }, { status: 400 });
  }

  const customer = await prisma.customers.findUnique({
    where: { customer_id: customerId },
  });

  if (!customer || !customer.password_hash) {
    return NextResponse.json({ error: "No password found. Set your password first." }, { status: 401 });
  }

  const isValidPassword = await verifyPassword(password, customer.password_hash);
  if (!isValidPassword) {
    return NextResponse.json({ error: "Login failed. Please check your customer ID and password." }, { status: 401 });
  }

  const response = NextResponse.json({
    customer: {
      id: customer.customer_id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      isAdmin: customer.is_admin,
    },
  });

  response.cookies.set({
    name: CUSTOMER_SESSION_COOKIE,
    value: String(customer.customer_id),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
