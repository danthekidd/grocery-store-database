import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerIdFromCookieHeader } from "@/lib/auth";

export async function GET(request: Request) {
  const customerId = getCustomerIdFromCookieHeader(request.headers.get("cookie"));

  if (!customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = await prisma.customers.findUnique({
    where: { customer_id: customerId },
    include: {
      orders: {
        orderBy: {
          order_id: "desc",
        },
        take: 12,
        include: {
          order_items: {
            include: {
              products: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    customer: {
      id: customer.customer_id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      isAdmin: customer.is_admin,
    },
    orders: customer.orders.map((order) => ({
      id: order.order_id,
      orderDate: order.order_date,
      totalAmount: order.total_amount ?? 0,
      items: order.order_items.map((item) => ({
        id: item.order_item_id,
        productId: item.product_id,
        productName: item.products.product_name,
        quantity: item.quantity,
        itemPrice: item.item_price,
      })),
    })),
  });
}
