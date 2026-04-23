"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ShopProduct = {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  supplier: string | null;
  price: number;
  stock: number;
};

type CategoryOption = {
  id: number;
  name: string;
};

type CartEntry = {
  product: ShopProduct;
  quantity: number;
};

type ShopDemoProps = {
  products: ShopProduct[];
  categories: CategoryOption[];
};

type CustomerSession = {
  id: number;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
};

type OrderSummary = {
  id: number;
  orderDate: string;
  totalAmount: number;
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    itemPrice: number;
  }>;
};

type OrdersMeResponse = {
  customer: CustomerSession;
  orders: OrderSummary[];
};

type CheckoutResponse = {
  message: string;
  order: OrderSummary;
  stockUpdates: Array<{
    productId: number;
    quantity: number;
  }>;
};

export function ShopDemo({ products, categories }: ShopDemoProps) {
  const [catalog, setCatalog] = useState<ShopProduct[]>(products);
  const [cart, setCart] = useState<Record<number, CartEntry>>({});
  const [checkoutMessage, setCheckoutMessage] = useState<string>("");
  const [authMessage, setAuthMessage] = useState<string>("");
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loginCustomerId, setLoginCustomerId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductStock, setNewProductStock] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState("");
  const [stockProductId, setStockProductId] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const response = await fetch("/api/orders/me");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as OrdersMeResponse;
      setCustomer(data.customer);
      setOrders(data.orders);
    }

    loadSession().catch(() => {
      // Ignore startup errors and keep unauthenticated UI state.
    });
  }, []);

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
        const next = { ...previous };
        delete next[productId];
        return next;
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

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setCheckoutMessage("");
    setIsBusy(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: loginCustomerId,
          password: loginPassword,
        }),
      });

      const data = (await response.json()) as { error?: string; customer?: CustomerSession };
      if (!response.ok || !data.customer) {
        setAuthMessage(data.error ?? "Login failed.");
        return;
      }

      const ordersResponse = await fetch("/api/orders/me");
      if (ordersResponse.ok) {
        const ordersData = (await ordersResponse.json()) as OrdersMeResponse;
        setCustomer(ordersData.customer);
        setOrders(ordersData.orders);
      } else {
        setCustomer(data.customer);
        setOrders([]);
      }

      setLoginCustomerId("");
      setLoginPassword("");
      setAuthMessage(`Logged in as ${data.customer.firstName} ${data.customer.lastName}.`);
    } catch {
      setAuthMessage("Could not log in right now.");
    } finally {
      setIsBusy(false);
    }
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminMessage("");
    setIsBusy(true);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: newProductSku,
          productName: newProductName,
          price: newProductPrice,
          stockQuantity: newProductStock,
          categoryId: newProductCategoryId,
        }),
      });

      const data = (await response.json()) as { error?: string; product?: ShopProduct };
      if (!response.ok || !data.product) {
        setAdminMessage(data.error ?? "Could not add product.");
        return;
      }

      setCatalog((previous) => [data.product!, ...previous]);
      setNewProductSku("");
      setNewProductName("");
      setNewProductPrice("");
      setNewProductStock("");
      setNewProductCategoryId("");
      setAdminMessage(`Added ${data.product.name}.`);
    } catch {
      setAdminMessage("Could not add product right now.");
    } finally {
      setIsBusy(false);
    }
  }

  async function updateStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminMessage("");
    setIsBusy(true);

    try {
      const response = await fetch(`/api/admin/products/${stockProductId}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockQuantity,
        }),
      });

      const data = (await response.json()) as { error?: string; product?: ShopProduct };
      if (!response.ok || !data.product) {
        setAdminMessage(data.error ?? "Could not update stock.");
        return;
      }

      setCatalog((previous) =>
        previous.map((product) => (product.id === data.product!.id ? data.product! : product)),
      );
      setStockProductId("");
      setStockQuantity("");
      setAdminMessage(`Updated stock for ${data.product.name}.`);
    } catch {
      setAdminMessage("Could not update stock right now.");
    } finally {
      setIsBusy(false);
    }
  }

  async function adjustProductStock(productId: number, nextStock: number) {
    setAdminMessage("");
    setIsBusy(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockQuantity: nextStock,
        }),
      });

      const data = (await response.json()) as { error?: string; product?: ShopProduct };
      if (!response.ok || !data.product) {
        setAdminMessage(data.error ?? "Could not update stock.");
        return;
      }

      setCatalog((previous) =>
        previous.map((product) => (product.id === data.product!.id ? data.product! : product)),
      );
      setAdminMessage(`Updated stock for ${data.product.name}.`);
    } catch {
      setAdminMessage("Could not update stock right now.");
    } finally {
      setIsBusy(false);
    }
  }

  async function logout() {
    setAuthMessage("");
    setCheckoutMessage("");
    setIsBusy(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCustomer(null);
      setOrders([]);
      setCart({});
      setAuthMessage("Logged out.");
    } catch {
      setAuthMessage("Could not log out right now.");
    } finally {
      setIsBusy(false);
    }
  }

  async function checkout() {
    if (cartItems.length === 0) {
      setCheckoutMessage("Your cart is empty. Add a few groceries first.");
      return;
    }

    if (!customer) {
      setCheckoutMessage("Please log in with your customer account before checking out.");
      return;
    }

    setIsBusy(true);

    try {
      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = (await response.json()) as { error?: string } | CheckoutResponse;
      if (!response.ok) {
        const errorMessage = "error" in data ? data.error : undefined;
        setCheckoutMessage(errorMessage ?? "Checkout failed.");
        return;
      }

      if (!("order" in data)) {
        setCheckoutMessage("Checkout failed.");
        return;
      }

      setOrders((previous) => [data.order, ...previous]);
      setCatalog((previous) => {
        const updates = new Map(data.stockUpdates.map((update) => [update.productId, update.quantity]));
        return previous.map((product) => {
          const decrementBy = updates.get(product.id) ?? 0;
          if (decrementBy === 0) {
            return product;
          }

          return {
            ...product,
            stock: Math.max(product.stock - decrementBy, 0),
          };
        });
      });

      setCart({});
      setCheckoutMessage(data.message);
    } catch {
      setCheckoutMessage("Checkout failed.");
    } finally {
      setIsBusy(false);
    }
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

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:auto-rows-fr">
            {catalog.map((product) => {
              const inCart = cart[product.id]?.quantity ?? 0;
              const isOutOfStock = product.stock === 0;
              return (
                <article key={product.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{product.sku}</p>
                  <h2 className="mt-2 text-lg font-bold leading-tight text-slate-900">{product.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {product.category ?? "Uncategorized"}
                    {product.supplier ? ` · ${product.supplier}` : ""}
                  </p>
                  <div className="mt-auto space-y-3 pt-4">
                    {customer?.isAdmin ? (
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Edit Stock
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => adjustProductStock(product.id, Math.max(product.stock - 1, 0))}
                            disabled={isBusy || product.stock === 0}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustProductStock(product.id, product.stock + 1)}
                            disabled={isBusy}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xl font-black text-slate-900">${product.price.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">Stock: {product.stock}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={isBusy || isOutOfStock || inCart >= product.stock}
                        className="rounded-xl bg-lime-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-lime-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {isOutOfStock ? "Sold out" : "Add"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.45)] sm:p-7 lg:sticky lg:top-8">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-black text-slate-900">Customer Login</h2>
            {customer ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-slate-700">
                  Signed in as <span className="font-semibold">{customer.firstName} {customer.lastName}</span>
                </p>
                <button
                  type="button"
                  onClick={logout}
                  disabled={isBusy}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <form className="mt-3 space-y-3" onSubmit={login}>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                  Customer ID
                  <input
                    type="number"
                    min={1}
                    value={loginCustomerId}
                    onChange={(event) => setLoginCustomerId(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-lime-200 focus:ring-2"
                    placeholder="e.g. 1"
                    required
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                  Password
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-lime-200 focus:ring-2"
                    placeholder="Your password"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  Log in
                </button>
              </form>
            )}
            {authMessage ? <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">{authMessage}</p> : null}

            {customer?.isAdmin ? (
              <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Admin Controls</h3>
                  <p className="mt-1 text-xs text-slate-600">Add products and update stock directly from the web.</p>
                </div>

                <form className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" onSubmit={createProduct}>
                  <p className="text-sm font-semibold text-slate-900">Add Product</p>
                  <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                    SKU
                    <input
                      type="text"
                      value={newProductSku}
                      onChange={(event) => setNewProductSku(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-lime-200 focus:ring-2"
                      required
                    />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Name
                    <input
                      type="text"
                      value={newProductName}
                      onChange={(event) => setNewProductName(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-lime-200 focus:ring-2"
                      required
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                      Price
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProductPrice}
                        onChange={(event) => setNewProductPrice(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-lime-200 focus:ring-2"
                        required
                      />
                    </label>
                    <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                      Stock
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={newProductStock}
                        onChange={(event) => setNewProductStock(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-lime-200 focus:ring-2"
                        required
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Category
                    <select
                      value={newProductCategoryId}
                      onChange={(event) => setNewProductCategoryId(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-lime-200 focus:ring-2"
                    >
                      <option value="">No category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                  >
                    Add Product
                  </button>
                </form>
                
              </div>
            ) : null}

            {adminMessage ? <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">{adminMessage}</p> : null}
          </section>

          <div className="flex items-center justify-between">
            <h2 className="mt-6 text-2xl font-black text-slate-900">Your Cart</h2>
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
            disabled={isBusy}
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            Checkout
          </button>

          {checkoutMessage ? <p className="mt-4 rounded-xl bg-lime-50 px-3 py-2 text-sm font-medium text-lime-800">{checkoutMessage}</p> : null}

          <section className="mt-6">
            <h3 className="text-lg font-black text-slate-900">Recent Orders</h3>
            {!customer ? (
              <p className="mt-2 text-sm text-slate-600">Log in to view your order history.</p>
            ) : orders.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No orders yet. Your checkout will show up here.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {orders.map((order) => (
                  <article key={order.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">Order #{order.id}</p>
                      <p className="text-xs text-slate-500">{order.orderDate}</p>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700">Total: ${order.totalAmount.toFixed(2)}</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.quantity} x {item.productName} @ ${item.itemPrice.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
