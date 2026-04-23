import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerIdFromCookieHeader } from "@/lib/auth";

type ProductCreateBody = {
  sku?: unknown;
  productName?: unknown;
  price?: unknown;
  stockQuantity?: unknown;
  categoryId?: unknown;
  supplierId?: unknown;
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

export async function POST(request: Request) {
  const adminCustomer = await getAdminCustomer(request);
  if (!adminCustomer) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as ProductCreateBody | null;
  const sku = String(body?.sku ?? "").trim();
  const productName = String(body?.productName ?? "").trim();
  const price = Number.parseFloat(String(body?.price ?? ""));
  const stockQuantity = Number.parseInt(String(body?.stockQuantity ?? ""), 10);
  const categoryIdRaw = String(body?.categoryId ?? "").trim();
  const supplierIdRaw = String(body?.supplierId ?? "").trim();
  const categoryId = categoryIdRaw ? Number.parseInt(categoryIdRaw, 10) : null;
  const supplierId = supplierIdRaw ? Number.parseInt(supplierIdRaw, 10) : null;

  if (!sku || !productName || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return NextResponse.json({ error: "Enter a valid SKU, name, price, and stock quantity." }, { status: 400 });
  }

  if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
    return NextResponse.json({ error: "Category must be a valid category ID." }, { status: 400 });
  }

  if (supplierId !== null && (!Number.isInteger(supplierId) || supplierId <= 0)) {
    return NextResponse.json({ error: "Supplier must be a valid supplier ID." }, { status: 400 });
  }

  const createdProduct = await prisma.products.create({
    data: {
      sku,
      product_name: productName,
      price,
      stock_quantity: stockQuantity,
      category_id: categoryId,
      supplier_id: supplierId,
    },
    include: {
      categories: true,
      suppliers: true,
    },
  });

  return NextResponse.json({
    product: {
      id: createdProduct.product_id,
      sku: createdProduct.sku,
      name: createdProduct.product_name,
      category: createdProduct.categories?.category_name ?? null,
      supplier: createdProduct.suppliers?.supplier_name ?? null,
      price: createdProduct.price,
      stock: createdProduct.stock_quantity,
    },
  });
}
