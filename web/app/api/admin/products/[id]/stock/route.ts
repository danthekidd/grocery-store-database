import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerIdFromCookieHeader } from "@/lib/auth";

type StockUpdateBody = {
  stockQuantity?: unknown;
};

async function getAdminCustomer(request: Request) {
  const customerId = getCustomerIdFromCookieHeader(request.headers.get("cookie"));
  if (!customerId) {
    return null;
  }

  const customer = await prisma.customers.findUnique({
    where: { customer_id: customerId },
  });

  if (!customer || !customer.is_admin) {
    return null;
  }

  return customer;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const adminCustomer = await getAdminCustomer(request);
  if (!adminCustomer) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const params = await context.params;
  const productId = Number.parseInt(params.id, 10);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as StockUpdateBody | null;
  const stockQuantity = Number.parseInt(String(body?.stockQuantity ?? ""), 10);

  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return NextResponse.json({ error: "Stock quantity must be zero or greater." }, { status: 400 });
  }

  const updatedProduct = await prisma.products.update({
    where: { product_id: productId },
    data: {
      stock_quantity: stockQuantity,
    },
    include: {
      categories: true,
      suppliers: true,
    },
  });

  return NextResponse.json({
    product: {
      id: updatedProduct.product_id,
      sku: updatedProduct.sku,
      name: updatedProduct.product_name,
      category: updatedProduct.categories?.category_name ?? null,
      supplier: updatedProduct.suppliers?.supplier_name ?? null,
      price: updatedProduct.price,
      stock: updatedProduct.stock_quantity,
    },
  });
}
