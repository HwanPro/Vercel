"use client";

import { Home, Plus, RefreshCw, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DailySale = {
  id: string;
  quantity: number;
  total: number;
  at: string;
  productName: string;
  customerName: string;
};

type SalesResponse = {
  ok: boolean;
  date: string;
  totals: {
    salesCount: number;
    itemsCount: number;
    amount: number;
  };
  sales: DailySale[];
  generatedAt: string;
};

type Product = {
  item_id: string;
  item_name: string;
  item_price: number;
  item_discount?: number | null;
  item_stock: number;
};

type CartItem = {
  productId: string;
  name: string;
  unitPrice: number;
  discount: number;
  quantity: number;
  stock: number;
};

const emptyData: SalesResponse = {
  ok: true,
  date: "",
  totals: {
    salesCount: 0,
    itemsCount: 0,
    amount: 0,
  },
  sales: [],
  generatedAt: "",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function finalUnitPrice(price: number, discount: number) {
  return price * (1 - discount / 100);
}

function escapeForTsv(value: string | number) {
  const text = String(value ?? "");
  return text.replace(/\t/g, " ").replace(/\r?\n/g, " ").trim();
}

export default function AdminSalesPage() {
  const router = useRouter();
  const [data, setData] = useState<SalesResponse>(emptyData);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const lastUpdateText = useMemo(() => {
    if (!data.generatedAt) return "Sin actualización";
    const d = new Date(data.generatedAt);
    if (Number.isNaN(d.getTime())) return "Sin actualización";
    return d.toLocaleString("es-PE");
  }, [data.generatedAt]);

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const unit = finalUnitPrice(item.unitPrice, item.discount);
        return sum + unit * item.quantity;
      }, 0),
    [cart]
  );

  const cartItemsTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  async function fetchSales(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/admin/sales/daily", {
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        throw new Error("No se pudo cargar la caja diaria");
      }

      const json: SalesResponse = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      console.error("Error cargando ventas diarias:", e);
      setError("Error al cargar las ventas del día.");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products", {
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        throw new Error("No se pudo cargar productos para caja");
      }

      const json: Product[] = await res.json();
      const available = json.filter((product) => product.item_stock > 0);
      setProducts(available);

      if (!selectedProductId && available.length > 0) {
        setSelectedProductId(available[0].item_id);
      }
    } catch (e) {
      console.error("Error cargando productos de caja:", e);
      setError("No se pudieron cargar productos para caja.");
    }
  }

  useEffect(() => {
    fetchSales(false);
    fetchProducts();
    const interval = setInterval(() => {
      fetchSales(true);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = () => {
    setNotice(null);
    setError(null);

    if (!selectedProductId) {
      setError("Seleccione un producto.");
      return;
    }
    if (!Number.isInteger(selectedQty) || selectedQty <= 0) {
      setError("La cantidad debe ser un número entero mayor a 0.");
      return;
    }

    const product = products.find((p) => p.item_id === selectedProductId);
    if (!product) {
      setError("Producto no encontrado.");
      return;
    }

    const alreadyInCart = cart.find((i) => i.productId === selectedProductId)?.quantity ?? 0;
    const requested = alreadyInCart + selectedQty;
    if (requested > product.item_stock) {
      setError(
        `Stock insuficiente. Disponible: ${product.item_stock}. En carrito: ${alreadyInCart}.`
      );
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((p) => p.productId === selectedProductId);
      if (idx < 0) {
        return [
          ...prev,
          {
            productId: product.item_id,
            name: product.item_name,
            unitPrice: product.item_price,
            discount: product.item_discount ?? 0,
            quantity: selectedQty,
            stock: product.item_stock,
          },
        ];
      }
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        quantity: updated[idx].quantity + selectedQty,
        stock: product.item_stock,
      };
      return updated;
    });

    setNotice("Producto agregado a la caja.");
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const dispatchSale = async () => {
    if (cart.length === 0 || saleLoading) return;

    setSaleLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/sales/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok || json?.ok === false) {
        const details = Array.isArray(json?.details)
          ? ` ${json.details.join(" | ")}`
          : "";
        throw new Error((json?.error || "No se pudo despachar la venta") + details);
      }

      clearCart();
      setNotice("Venta despachada correctamente.");
      await Promise.all([fetchSales(true), fetchProducts()]);
    } catch (e) {
      console.error("Error despachando venta:", e);
      setError(e instanceof Error ? e.message : "Error despachando la venta.");
    } finally {
      setSaleLoading(false);
    }
  };

  const exportDailyExcel = () => {
    const header = ["Fecha", "Hora", "Producto", "Cliente", "Cantidad", "Total (S/)"];
    const rows = data.sales.map((sale) => {
      const date = new Date(sale.at);
      const dateText = Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleDateString("es-PE");
      const hourText = Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
      return [
        dateText,
        hourText,
        sale.productName,
        sale.customerName,
        sale.quantity,
        sale.total.toFixed(2),
      ];
    });

    rows.push([]);
    rows.push(["", "", "", "TOTAL DEL DIA", data.totals.itemsCount, data.totals.amount.toFixed(2)]);

    const tsv = [header, ...rows]
      .map((cols) => cols.map((v) => escapeForTsv(v)).join("\t"))
      .join("\n");

    // Excel abre correctamente este archivo .xls tabulado con BOM UTF-8.
    const blob = new Blob(["\uFEFF", tsv], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateSuffix = data.date || new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `wolfgym-caja-${dateSuffix}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 bg-black px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-yellow-400 md:text-3xl">Caja diaria</h1>
            <p className="text-sm text-zinc-400">
              Despacho de productos y cierre de ventas del día.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportDailyExcel}
              className="inline-flex items-center gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/20"
            >
              Exportar Excel
            </button>
            <button
              type="button"
              onClick={() => {
                fetchSales(true);
                fetchProducts();
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refrescar
            </button>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 p-4 md:p-8">
        <section className="grid gap-3 md:grid-cols-3">
          <article className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Ventas</p>
            <p className="mt-2 text-3xl font-bold text-yellow-400">{data.totals.salesCount}</p>
          </article>
          <article className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Productos vendidos</p>
            <p className="mt-2 text-3xl font-bold text-white">{data.totals.itemsCount}</p>
          </article>
          <article className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Total del día</p>
            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {formatMoney(data.totals.amount)}
            </p>
          </article>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 bg-black px-4 py-3">
            <h2 className="text-lg font-bold text-yellow-400">Despacho en caja</h2>
            <p className="text-xs text-zinc-500">
              Selecciona productos, arma la cuenta y confirma venta.
            </p>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-[1fr_120px_auto]">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="h-11 rounded-md border border-zinc-700 bg-black px-3 text-sm text-white outline-none focus:border-yellow-400"
            >
              {products.length === 0 ? (
                <option value="">Sin productos con stock</option>
              ) : (
                products.map((product) => {
                  const discount = product.item_discount ?? 0;
                  const unit = finalUnitPrice(product.item_price, discount);
                  return (
                    <option key={product.item_id} value={product.item_id}>
                      {product.item_name} | {formatMoney(unit)} | Stock {product.item_stock}
                    </option>
                  );
                })
              )}
            </select>

            <input
              type="number"
              min={1}
              value={selectedQty}
              onChange={(e) => setSelectedQty(Number(e.target.value))}
              className="h-11 rounded-md border border-zinc-700 bg-black px-3 text-sm text-white outline-none focus:border-yellow-400"
            />

            <button
              type="button"
              onClick={addToCart}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>

          {error && (
            <div className="px-4 pb-2 text-sm font-medium text-red-300">{error}</div>
          )}
          {notice && (
            <div className="px-4 pb-2 text-sm font-medium text-yellow-300">{notice}</div>
          )}

          <div className="overflow-x-auto border-t border-zinc-800">
            <table className="min-w-full text-sm">
              <thead className="bg-black/70 text-left text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 text-right font-semibold">Cant.</th>
                  <th className="px-4 py-3 text-right font-semibold">Unit.</th>
                  <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                  <th className="px-4 py-3 text-right font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr className="border-t border-zinc-800">
                    <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                      Aún no agregaste productos a la caja.
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => {
                    const unit = finalUnitPrice(item.unitPrice, item.discount);
                    const subtotal = unit * item.quantity;
                    return (
                      <tr key={item.productId} className="border-t border-zinc-800">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="text-xs text-zinc-500">Stock: {item.stock}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-white">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-white">{formatMoney(unit)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-yellow-300">
                          {formatMoney(subtotal)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-500/50 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Quitar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-end gap-3 border-t border-zinc-800 p-4 md:flex-row md:items-center md:justify-end">
            <div className="text-right">
              <p className="text-xs text-zinc-500">Productos en cuenta: {cartItemsTotal}</p>
              <p className="text-xl font-bold text-yellow-300">{formatMoney(cartTotal)}</p>
            </div>

            <button
              type="button"
              onClick={dispatchSale}
              disabled={saleLoading || cart.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingCart className="h-4 w-4" />
              {saleLoading ? "Despachando..." : "Despachar venta"}
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-black px-4 py-3">
            <div>
              <h2 className="text-lg font-bold text-yellow-400">Movimientos del día</h2>
              <p className="text-xs text-zinc-500">Última actualización: {lastUpdateText}</p>
            </div>
            <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
              {data.date || "Hoy"}
            </span>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-zinc-400">Cargando ventas...</div>
          ) : data.sales.length === 0 ? (
            <div className="p-4 text-sm text-zinc-400">No hay ventas registradas hoy.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-black/60 text-left text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Hora</th>
                    <th className="px-4 py-3 font-semibold">Producto</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 text-right font-semibold">Cant.</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales.map((sale) => (
                    <tr key={sale.id} className="border-t border-zinc-800">
                      <td className="px-4 py-3 text-zinc-300">
                        {new Date(sale.at).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{sale.productName}</td>
                      <td className="px-4 py-3 text-zinc-300">{sale.customerName}</td>
                      <td className="px-4 py-3 text-right text-white">{sale.quantity}</td>
                      <td className="px-4 py-3 text-right font-semibold text-yellow-300">
                        {formatMoney(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
