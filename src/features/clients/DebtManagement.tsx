// src/features/clients/DebtManagement.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/dialog";
import { Button } from "@/ui/button";
import Swal, { SweetAlertOptions, SweetAlertResult } from "sweetalert2";

interface DebtItem {
  id: string;
  productId?: string;
  productName: string;
  amount: number;
  quantity: number;
  createdAt: string;
}

interface DebtData {
  dailyDebts: DebtItem[];
  dailyTotal: number;
  monthlyDebt: number;
  totalDebt: number;
}

interface DebtManagementProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  profileId: string;
}

interface GymProduct {
  item_id: string;
  item_name: string;
  item_price: number;
  category?: string;
  item_stock: number;
}

// Colores por categoría
const getCategoryColor = (category?: string) => {
  switch (category?.toLowerCase()) {
    case "agua":
      return "bg-blue-600";
    case "proteina":
      return "bg-green-600";
    case "pre-entreno":
      return "bg-orange-600";
    case "suplementos":
      return "bg-purple-600";
    case "snacks":
      return "bg-yellow-600";
    default:
      return "bg-gray-600";
  }
};

export default function DebtManagement({
  isOpen,
  onClose,
  clientName,
  profileId,
}: DebtManagementProps) {
  const [debtData, setDebtData] = useState<DebtData | null>(null);
  const [gymProducts, setGymProducts] = useState<GymProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  // 🔸 Contenedor para montar SweetAlert dentro del Dialog
  const swalTargetRef = useRef<HTMLDivElement | null>(null);

  // Helper para mostrar SweetAlert DENTRO del Dialog (sin overlay adicional)
  const swalInDialog = (opts: SweetAlertOptions): Promise<SweetAlertResult> => {
    return Swal.fire({
      target: swalTargetRef.current ?? undefined,
      backdrop: false,
      allowOutsideClick: false,
      returnFocus: false,
      ...opts,
    });
  };

  const fetchDebts = async () => {
    if (!profileId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/debts?clientProfileId=${profileId}`);
      if (response.ok) {
        const data = await response.json();
        setDebtData(data);
      }
    } catch (error) {
      console.error("Error fetching debts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGymProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await fetch("/api/products/gym");
      if (response.ok) {
        const products = await response.json();
        setGymProducts(products);
      }
    } catch (error) {
      console.error("Error fetching gym products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && profileId) {
      fetchDebts();
      fetchGymProducts();
    }
  }, [isOpen, profileId]);

  const addDebt = async (
    productId?: string,
    customAmount?: number,
    customName?: string
  ) => {
    try {
      // Encontrar el producto seleccionado
      const selectedProduct = gymProducts.find((p) => p.item_id === productId);

      let productType = "CUSTOM";
      let finalAmount = customAmount || 0;
      let finalName = customName || "Producto personalizado";

      if (selectedProduct) {
        // Mapear producto real a ProductType enum
        const categoryMap: { [key: string]: string } = {
          agua:
            selectedProduct.item_price === 1.5
              ? "WATER_1_5"
              : selectedProduct.item_price === 2.5
                ? "WATER_2_5"
                : "WATER_3_5",
          proteina: "PROTEIN_5",
          "pre-entreno":
            selectedProduct.item_price === 3
              ? "PRE_WORKOUT_3"
              : selectedProduct.item_price === 5
                ? "PRE_WORKOUT_5"
                : "PRE_WORKOUT_10",
        };

        productType =
          categoryMap[selectedProduct.category?.toLowerCase() || ""] ||
          "CUSTOM";
        finalAmount = selectedProduct.item_price;
        finalName = selectedProduct.item_name;
      }

      const response = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientProfileId: profileId,
          productType,
          quantity: 1,
          customAmount: productType === "CUSTOM" ? finalAmount : undefined,
          customName: productType === "CUSTOM" ? finalName : undefined,
        }),
      });

      if (response.ok) {
        await swalInDialog({
          icon: "success",
          title: "Deuda agregada",
          timer: 1400,
          showConfirmButton: false,
        });
        fetchDebts();
      } else {
        throw new Error("Error al agregar deuda");
      }
    } catch (error) {
      await swalInDialog({
        icon: "error",
        title: "Error",
        text: "No se pudo agregar la deuda",
      });
    }
  };

  const addCustomDebt = async () => {
    const { value: customData } = await swalInDialog({
      title: "Producto personalizado",
      html: `
        <input id="customName" class="swal2-input" placeholder="Nombre del producto">
        <input id="customAmount" class="swal2-input" type="number" step="0.01" placeholder="Precio">
      `,
      focusConfirm: false,
      preConfirm: () => {
        const name = (document.getElementById("customName") as HTMLInputElement)
          ?.value;
        const amount = parseFloat(
          (document.getElementById("customAmount") as HTMLInputElement)
            ?.value || "0"
        );
        if (!name || amount <= 0) {
          Swal.showValidationMessage("Ingresa nombre y precio válidos");
          return false as any;
        }
        return { name, amount };
      },
      confirmButtonText: "OK",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
    });

    if (customData) {
      addDebt(undefined, customData.amount, customData.name);
    }
  };

  const removeDebt = async (debtId: string) => {
    const result = await swalInDialog({
      title: "¿Eliminar deuda?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const response = await fetch(`/api/debts?debtId=${debtId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await swalInDialog({
        icon: "success",
        title: "Deuda eliminada",
        timer: 1200,
        showConfirmButton: false,
      });
      fetchDebts();
    } else {
      await swalInDialog({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar la deuda",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 👇 ESTE DIV es donde SweetAlert va a montarse */}
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto z-50">
        <div id="debt-swal-root" ref={swalTargetRef} />

        <DialogTitle>Gestión de Deudas - {clientName}</DialogTitle>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
          </div>
        ) : debtData ? (
          <div className="space-y-6">
            {/* Resumen de deudas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Deuda Diaria</h3>
                <p className="text-2xl font-bold text-blue-600">
                  S/. {debtData.dailyTotal.toFixed(2)}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800">Deuda Mensual</h3>
                <p className="text-2xl font-bold text-red-600">
                  S/. {debtData.monthlyDebt.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800">Total</h3>
                <p className="text-2xl font-bold text-gray-600">
                  S/. {debtData.totalDebt.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Agregar nueva deuda */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Agregar Producto</h3>

              {productsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {gymProducts.map((product: GymProduct) => (
                    <Button
                      key={product.item_id}
                      onClick={() => addDebt(product.item_id)}
                      className={`${getCategoryColor(
                        product.category
                      )} hover:opacity-80 text-white text-xs p-2 h-auto flex flex-col`}
                      disabled={product.item_stock <= 0}
                    >
                      <span className="font-medium">{product.item_name}</span>
                      <span className="text-xs opacity-90">
                        S/. {product.item_price.toFixed(2)}
                      </span>
                      {product.item_stock <= 0 && (
                        <span className="text-xs text-red-200">Sin stock</span>
                      )}
                    </Button>
                  ))}
                  <Button
                    onClick={addCustomDebt}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs p-2 h-auto"
                  >
                    Personalizado
                  </Button>
                </div>
              )}

              {gymProducts.length === 0 && !productsLoading && (
                <p className="text-gray-500 text-center py-4">
                  No hay productos de gimnasio disponibles.
                  <br />
                  <span className="text-sm">
                    Agrega productos marcados como &quot;Solo para
                    gimnasio&quot; desde el panel de administración.
                  </span>
                </p>
              )}
            </div>

            {/* Lista de deudas diarias */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Deudas del Día</h3>
              {debtData.dailyDebts.length === 0 ? (
                <p className="text-gray-500">
                  No hay deudas pendientes del día
                </p>
              ) : (
                <div className="space-y-2">
                  {debtData.dailyDebts.map((debt) => (
                    <div
                      key={debt.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{debt.productName}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          Cantidad: {debt.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-600">
                          S/. {debt.amount.toFixed(2)}
                        </span>
                        <Button
                          onClick={() => removeDebt(debt.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center py-8">No se pudieron cargar los datos</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
