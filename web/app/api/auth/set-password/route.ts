import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/password";

type SetPasswordBody = {
  customerId?: unknown;
  lastName?: unknown;
  newPassword?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SetPasswordBody | null;

  const customerId = Number.parseInt(String(body?.customerId ?? ""), 10);
  const lastName = String(body?.lastName ?? "").trim();
  const newPassword = String(body?.newPassword ?? "");

  if (!Number.isInteger(customerId) || customerId <= 0 || !lastName || !newPassword) {
    return NextResponse.json({ error: "Provide customer ID, last name, and a new password." }, { status: 400 });
  }

  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const customer = await prisma.customers.findUnique({
    where: { customer_id: customerId },
  });

  if (!customer || customer.last_name.toLowerCase() !== lastName.toLowerCase()) {
    return NextResponse.json({ error: "Identity check failed for customer ID and last name." }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.customers.update({
    where: { customer_id: customerId },
    data: {
      password_hash: passwordHash,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Password set. You can now log in with your customer ID and password.",
  });
}
