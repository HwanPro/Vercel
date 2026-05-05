"use client";

import { Plus, RefreshCw, ShoppingCart, Trash2 } from "lucide-react";
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
  totals: { salesCount: 0, itemsCount: 0, amount: 0 },
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

const card: React.CSSProperties = {
  background: "#141414",
  border: "1px solid rgba(255,194,26,0.12)",
  borderRadius: 14,
  overflow: "hidden",
};

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(255,194,26,0.6)",
  margin: 0,
};

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
    [cart],
  );

  const cartItemsTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  async function fetchSales(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/sales/daily", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) { router.replace("/auth/login"); return; }
      if (!res.ok) throw new Error("No se pudo cargar la caja diaria");
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
      const res = await fetch("/api/products", { credentials: "include", cache: "no-store" });
      if (res.status === 401) { router.replace("/auth/login"); return; }
      if (!res.ok) throw new Error("No se pudo cargar productos para caja");
      const json: Product[] = await res.json();
      const available = json.filter((p) => p.item_stock > 0);
      setProducts(available);
      if (!selectedProductId && available.length > 0) setSelectedProductId(available[0].item_id);
    } catch (e) {
      console.error("Error cargando productos de caja:", e);
      setError("No se pudieron cargar productos para caja.");
    }
  }

  useEffect(() => {
    fetchSales(false);
    fetchProducts();
    const interval = setInterval(() => fetchSales(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = () => {
    setNotice(null);
    setError(null);
    if (!selectedProductId) { setError("Seleccione un producto."); return; }
    if (!Number.isInteger(selectedQty) || selectedQty <= 0) { setError("La cantidad debe ser mayor a 0."); return; }
    const product = products.find((p) => p.item_id === selectedProductId);
    if (!product) { setError("Producto no encontrado."); return; }
    const alreadyInCart = cart.find((i) => i.productId === selectedProductId)?.quantity ?? 0;
    const requested = alreadyInCart + selectedQty;
    if (requested > product.item_stock) {
      setError(`Stock insuficiente. Disponible: ${product.item_stock}. En carrito: ${alreadyInCart}.`);
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.productId === selectedProductId);
      if (idx < 0) {
        return [...prev, { productId: product.item_id, name: product.item_name, unitPrice: product.item_price, discount: product.item_discount ?? 0, quantity: selectedQty, stock: product.item_stock }];
      }
      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + selectedQty, stock: product.item_stock };
      return updated;
    });
    setNotice("Producto agregado a la caja.");
  };

  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((item) => item.productId !== productId));
  const clearCart = () => setCart([]);

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
        body: JSON.stringify({ items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })) }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) { router.replace("/auth/login"); return; }
      if (!res.ok || json?.ok === false) {
        const details = Array.isArray(json?.details) ? ` ${json.details.join(" | ")}` : "";
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
      const dateText = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-PE");
      const hourText = Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      return [dateText, hourText, sale.productName, sale.customerName, sale.quantity, sale.total.toFixed(2)];
    });
    rows.push([]);
    rows.push(["", "", "", "TOTAL DEL DIA", data.totals.itemsCount, data.totals.amount.toFixed(2)]);
    const tsv = [header, ...rows].map((cols) => cols.map((v) => escapeForTsv(v)).join("\t")).join("\n");
    const blob = new Blob(["﻿", tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
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

  const inputStyle: React.CSSProperties = {
    height: 42,
    padding: "0 14px",
    background: "#0A0A0A",
    border: "1px solid rgba(255,194,26,0.2)",
    borderRadius: 10,
    color: "#fff",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Page header */}
      <div
        style={{
          padding: "24px 32px 20px",
          borderBottom: "1px solid rgba(255,194,26,0.12)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p style={eyebrow}>Tienda · Ventas</p>
          <h1
            style={{
              fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
              fontSize: 36,
              letterSpacing: "0.02em",
              color: "#fff",
              margin: "4px 0 0",
              lineHeight: 1,
            }}
          >
            CAJA DIARIA
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "4px 0 0" }}>
            Despacho de productos y cierre de ventas del día.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href="/admin/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 38,
              padding: "0 16px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            ← Dashboard
          </a>
          <button
            type="button"
            onClick={exportDailyExcel}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 38,
              padding: "0 16px",
              background: "transparent",
              border: "1px solid rgba(255,194,26,0.35)",
              borderRadius: 10,
              color: "#FFC21A",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            ↓ Exportar Excel
          </button>
          <button
            type="button"
            onClick={() => { fetchSales(true); fetchProducts(); }}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 38,
              padding: "0 16px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              fontWeight: 600,
              cursor: refreshing ? "not-allowed" : "pointer",
              opacity: refreshing ? 0.6 : 1,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            <RefreshCw style={{ width: 14, height: 14, animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Refrescar
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Summary metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { label: "Ventas del día", value: data.totals.salesCount, yellow: true },
            { label: "Productos vendidos", value: data.totals.itemsCount, yellow: false },
            { label: "Total recaudado", value: formatMoney(data.totals.amount), yellow: true },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                background: "#141414",
                border: "1px solid rgba(255,194,26,0.12)",
                borderRadius: 14,
                padding: "18px 20px",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                  margin: "0 0 8px",
                }}
              >
                {m.label}
              </p>
              <p
                style={{
                  fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
                  fontSize: 36,
                  lineHeight: 1,
                  color: m.yellow ? "#FFC21A" : "#fff",
                  margin: 0,
                }}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Dispatch section */}
        <div style={card}>
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid rgba(255,194,26,0.10)",
            }}
          >
            <p style={eyebrow}>Despacho en caja</p>
            <h2
              style={{
                fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
                fontSize: 24,
                letterSpacing: "0.02em",
                color: "#fff",
                margin: "4px 0 0",
                lineHeight: 1,
              }}
            >
              REGISTRAR VENTA
            </h2>
          </div>

          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: 10, alignItems: "end" }}>
              <div>
                <p style={{ ...eyebrow, margin: "0 0 6px" }}>Producto</p>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
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
              </div>
              <div>
                <p style={{ ...eyebrow, margin: "0 0 6px" }}>Cant.</p>
                <input
                  type="number"
                  min={1}
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <button
                type="button"
                onClick={addToCart}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  height: 42,
                  padding: "0 18px",
                  background: "#FFC21A",
                  color: "#0A0A0A",
                  border: "1px solid #FFC21A",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                Agregar
              </button>
            </div>

            {error && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  background: "rgba(229,72,77,0.08)",
                  border: "1px solid rgba(229,72,77,0.3)",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#E5484D",
                }}
              >
                {error}
              </div>
            )}
            {notice && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  background: "rgba(46,189,117,0.08)",
                  border: "1px solid rgba(46,189,117,0.3)",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#2EBD75",
                }}
              >
                {notice}
              </div>
            )}
          </div>

          {/* Cart table */}
          <div style={{ borderTop: "1px solid rgba(255,194,26,0.10)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.4)" }}>
                  {["Producto", "Cant.", "Precio unit.", "Subtotal", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: h === "" || h === "Cant." || h === "Precio unit." || h === "Subtotal" ? "right" : "left",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(255,194,26,0.6)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "28px 16px",
                        textAlign: "center",
                        color: "rgba(255,255,255,0.3)",
                        fontSize: 13,
                      }}
                    >
                      Aún no agregaste productos a la caja.
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => {
                    const unit = finalUnitPrice(item.unitPrice, item.discount);
                    const subtotal = unit * item.quantity;
                    return (
                      <tr
                        key={item.productId}
                        style={{ borderTop: "1px solid rgba(255,194,26,0.07)" }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <p style={{ fontWeight: 600, color: "#fff", margin: 0 }}>{item.name}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                            Stock: {item.stock}
                          </p>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", color: "#fff" }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>
                          {formatMoney(unit)}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            textAlign: "right",
                            fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
                            fontSize: 18,
                            color: "#FFC21A",
                          }}
                        >
                          {formatMoney(subtotal)}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "4px 10px",
                              background: "rgba(229,72,77,0.08)",
                              border: "1px solid rgba(229,72,77,0.35)",
                              borderRadius: 6,
                              color: "#E5484D",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "'Inter', system-ui, sans-serif",
                            }}
                          >
                            <Trash2 style={{ width: 12, height: 12 }} />
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

          {/* Cart footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 20,
              padding: "16px 20px",
              borderTop: "1px solid rgba(255,194,26,0.10)",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                {cartItemsTotal} producto{cartItemsTotal !== 1 ? "s" : ""} en cuenta
              </p>
              <p
                style={{
                  fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
                  fontSize: 28,
                  color: "#FFC21A",
                  margin: "2px 0 0",
                  lineHeight: 1,
                }}
              >
                {formatMoney(cartTotal)}
              </p>
            </div>
            <button
              type="button"
              onClick={dispatchSale}
              disabled={saleLoading || cart.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 44,
                padding: "0 24px",
                background: cart.length === 0 ? "rgba(255,194,26,0.3)" : "#FFC21A",
                color: "#0A0A0A",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: saleLoading || cart.length === 0 ? "not-allowed" : "pointer",
                opacity: saleLoading ? 0.6 : 1,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              <ShoppingCart style={{ width: 16, height: 16 }} />
              {saleLoading ? "Despachando..." : "Despachar venta"}
            </button>
          </div>
        </div>

        {/* Daily movements */}
        <div style={card}>
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid rgba(255,194,26,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={eyebrow}>Registro del día</p>
              <h2
                style={{
                  fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
                  fontSize: 24,
                  letterSpacing: "0.02em",
                  color: "#fff",
                  margin: "4px 0 0",
                  lineHeight: 1,
                }}
              >
                MOVIMIENTOS
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
                Última actualización: {lastUpdateText}
              </p>
            </div>
            <span
              style={{
                padding: "4px 12px",
                background: "rgba(255,194,26,0.1)",
                border: "1px solid rgba(255,194,26,0.35)",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                color: "#FFC21A",
              }}
            >
              {data.date || "Hoy"}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: "24px 20px", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
              Cargando ventas...
            </div>
          ) : data.sales.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              No hay ventas registradas hoy.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.4)" }}>
                    {["Hora", "Producto", "Cliente", "Cant.", "Total"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: i >= 3 ? "right" : "left",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "rgba(255,194,26,0.6)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.sales.map((sale) => (
                    <tr key={sale.id} style={{ borderTop: "1px solid rgba(255,194,26,0.07)" }}>
                      <td style={{ padding: "11px 16px", color: "rgba(255,255,255,0.6)", fontFamily: "monospace", fontSize: 12 }}>
                        {new Date(sale.at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td style={{ padding: "11px 16px", fontWeight: 600, color: "#fff" }}>{sale.productName}</td>
                      <td style={{ padding: "11px 16px", color: "rgba(255,255,255,0.65)" }}>{sale.customerName}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#fff" }}>{sale.quantity}</td>
                      <td
                        style={{
                          padding: "11px 16px",
                          textAlign: "right",
                          fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
                          fontSize: 18,
                          color: "#FFC21A",
                        }}
                      >
                        {formatMoney(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
