import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerIdFromCookieHeader } from "@/lib/auth";

type CheckoutBody = {
  items?: Array<{
    productId?: unknown;
    quantity?: unknown;
  }>;
};

export async function POST(request: Request) {
  const customerId = getCustomerIdFromCookieHeader(request.headers.get("cookie"));
  if (!customerId) {
    return NextResponse.json({ error: "Login required to checkout." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CheckoutBody | null;
  const rawItems = Array.isArray(body?.items) ? body.items : [];

  const sanitizedItems = rawItems
    .map((item) => ({
      productId: Number.parseInt(String(item.productId ?? ""), 10),
      quantity: Number.parseInt(String(item.quantity ?? ""), 10),
    }))
    .filter((item) => Number.isInteger(item.productId) && item.productId > 0 && Number.isInteger(item.quantity) && item.quantity > 0);

  if (sanitizedItems.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const requestedByProductId = new Map<number, number>();
  for (const item of sanitizedItems) {
    requestedByProductId.set(item.productId, (requestedByProductId.get(item.productId) ?? 0) + item.quantity);
  }

  const productIds = Array.from(requestedByProductId.keys());
  const products = await prisma.products.findMany({
    where: {
      product_id: {
        in: productIds,
      },
    },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Some products were not found." }, { status: 400 });
  }

  const productById = new Map(products.map((product) => [product.product_id, product]));

  for (const [productId, quantity] of requestedByProductId) {
    const product = productById.get(productId);
    if (!product) {
      return NextResponse.json({ error: "Some products were not found." }, { status: 400 });
    }

    if (product.stock_quantity < quantity) {
      return NextResponse.json(
        {
          error: `Not enough stock for ${product.product_name}. Remaining stock: ${product.stock_quantity}.`,
        },
        { status: 400 },
      );
    }
  }

  const totalAmount = Array.from(requestedByProductId.entries()).reduce((sum, [productId, quantity]) => {
    const product = productById.get(productId);
    return sum + (product?.price ?? 0) * quantity;
  }, 0);

  const today = new Date().toISOString().slice(0, 10);

  const createdOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.orders.create({
      data: {
        customer_id: customerId,
        order_date: today,
        total_amount: totalAmount,
      },
    });

    await tx.order_items.createMany({
      data: Array.from(requestedByProductId.entries()).map(([productId, quantity]) => {
        const product = productById.get(productId)!;
        return {
          order_id: order.order_id,
          product_id: productId,
          quantity,
          item_price: product.price,
        };
      }),
    });

    for (const [productId, quantity] of requestedByProductId) {
      await tx.products.update({
        where: { product_id: productId },
        data: {
          stock_quantity: {
            decrement: quantity,
          },
        },
      });
    }

    return tx.orders.findUnique({
      where: { order_id: order.order_id },
      include: {
        order_items: {
          include: {
            products: true,
          },
        },
      },
    });
  });

  if (!createdOrder) {
    return NextResponse.json({ error: "Checkout failed." }, { status: 500 });
  }

  return NextResponse.json({
    message: `Order #${createdOrder.order_id} placed successfully.`,
    order: {
      id: createdOrder.order_id,
      orderDate: createdOrder.order_date,
      totalAmount: createdOrder.total_amount ?? 0,
      items: createdOrder.order_items.map((item) => ({
        id: item.order_item_id,
        productId: item.product_id,
        productName: item.products.product_name,
        quantity: item.quantity,
        itemPrice: item.item_price,
      })),
    },
    stockUpdates: Array.from(requestedByProductId.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    })),
  });
}
