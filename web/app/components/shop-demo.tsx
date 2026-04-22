"use client";

import { useMemo, useState } from "react";

type ShopProduct = {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  supplier: string | null;
  price: number;
  stock: number;
};

type CartEntry = {
  product: ShopProduct;
  quantity: number;
};

type ShopDemoProps = {
  products: ShopProduct[];
};

export function ShopDemo({ products }: ShopDemoProps) {
  const [cart, setCart] = useState<Record<number, CartEntry>>({});
  const [checkoutMessage, setCheckoutMessage] = useState<string>("");

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    [cartItems],
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  function addToCart(product: ShopProduct) {
    setCheckoutMessage("");
    setCart((previous) => {
      const existing = previous[product.id];
      const nextQuantity = Math.min((existing?.quantity ?? 0) + 1, product.stock);

      if (nextQuantity === 0) {
        return previous;
      }

      return {
        ...previous,
        [product.id]: {
          product,
          quantity: nextQuantity,
        },
      };
    });
  }

  function decrementItem(productId: number) {
    setCheckoutMessage("");
    setCart((previous) => {
      const existing = previous[productId];
      if (!existing) {
        return previous;
      }

      if (existing.quantity === 1) {
        const { [productId]: _removed, ...rest } = previous;
        return rest;
      }

      return {
        ...previous,
        [productId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  }

  function checkout() {
    if (cartItems.length === 0) {
      setCheckoutMessage("Your cart is empty. Add a few groceries first.");
      return;
    }

    const orderId = Math.floor(Math.random() * 90000) + 10000;
    setCart({});
    setCheckoutMessage(`Order #${orderId} placed. This is a demo checkout.`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfccb,_#e0f2fe_55%,_#f8fafc)] px-5 py-8 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-3xl border border-lime-200/70 bg-white/80 p-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-700">Grocery Store Demo</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">The best place to get your groceries ever</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Browse tons of high quality products, add them to your cart, and run checkout.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const inCart = cart[product.id]?.quantity ?? 0;
              const isOutOfStock = product.stock === 0;
              return (
                <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{product.sku}</p>
                  <h2 className="mt-2 text-lg font-bold leading-tight text-slate-900">{product.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {product.category ?? "Uncategorized"}
                    {product.supplier ? ` · ${product.supplier}` : ""}
                  </p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-xl font-black text-slate-900">${product.price.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">Stock: {product.stock}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock || inCart >= product.stock}
                      className="rounded-xl bg-lime-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-lime-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isOutOfStock ? "Sold out" : "Add"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.45)] sm:p-7 lg:sticky lg:top-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900">Your Cart</h2>
            <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">{cartCount} items</span>
          </div>

          <div className="mt-5 space-y-3">
            {cartItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">Your cart is waiting for groceries.</p>
            ) : (
              cartItems.map((item) => (
                <div key={item.product.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-semibold text-slate-900">{item.product.name}</p>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                    <p>
                      {item.quantity} x ${item.product.price.toFixed(2)}
                    </p>
                    <button
                      type="button"
                      onClick={() => decrementItem(item.product.id)}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Remove one
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd>${subtotal.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <dt>Tax (8%)</dt>
              <dd>${tax.toFixed(2)}</dd>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
              <dt>Total</dt>
              <dd>${total.toFixed(2)}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={checkout}
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Checkout
          </button>

          {checkoutMessage ? <p className="mt-4 rounded-xl bg-lime-50 px-3 py-2 text-sm font-medium text-lime-800">{checkoutMessage}</p> : null}
        </aside>
      </div>
    </main>
  );
}
