"use client";

import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import Link from "next/link";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/ui/dialog";

import AddProductDialog from "@/features/products/AddProductDialog";
import EditProductDialog from "@/features/products/EditProductDialog";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  imageUrl: string;
};

type NewProduct = Omit<Product, "id">;

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Error al obtener los productos");

      const data = await response.json();
      setProducts(
        data.map((product: { 
          item_id: string;
          item_name: string;
          item_description: string;
          item_price: number;
          item_discount?: number;
          item_stock: number;
          item_image_url?: string;
        }) => ({
          id: product.item_id,
          name: product.item_name,
          description: product.item_description,
          price: product.item_price,
          discount: product.item_discount || 0,
          stock: product.item_stock,
          imageUrl: product.item_image_url || "/placeholder-image.png",
        }))
      );
    } catch (error) {
      console.error("Error al obtener los productos:", error);
      toast.error("Error al obtener los productos", {
        position: "top-center",
        style: { backgroundColor: "#FF0000", color: "#FFF" },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddSave = async (newProduct: NewProduct) => {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_name: newProduct.name,
        item_description: newProduct.description,
        item_price: newProduct.price,
        item_discount: newProduct.discount || 0,
        item_stock: newProduct.stock,
        item_image_url: newProduct.imageUrl,
      }),
    });

    if (!response.ok) throw new Error("Error al agregar el producto");
    try {
      toast.success("Producto agregado con éxito", {
        position: "top-right",
        style: { backgroundColor: "#00C853", color: "#FFF" },
      });
      await fetchProducts();
    } catch (error) {
      console.error("Error al agregar el producto:", error);
      toast.error("Error al agregar el producto", {
        position: "top-center",
        style: { backgroundColor: "#FF0000", color: "#FFF" },
      });
    }
  };

  const handleEditSave = async (updatedProduct: Product) => {
    setActionLoading(updatedProduct.id);
    try {
      const response = await fetch(`/api/products/${updatedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: updatedProduct.name,
          item_description: updatedProduct.description,
          item_price: updatedProduct.price,
          item_discount: updatedProduct.discount || 0,
          item_stock: updatedProduct.stock,
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar el producto");

      toast.success("Producto actualizado con éxito", {
        position: "top-right",
        style: { backgroundColor: "#00C853", color: "#FFF" },
      });
      await fetchProducts();
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      toast.error("Error al actualizar el producto", {
        position: "top-center",
        style: { backgroundColor: "#FF0000", color: "#FFF" },
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm(
      "¿Estás seguro de que deseas eliminar este producto?"
    );
    if (!confirm) return;

    setActionLoading(id);
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar el producto");

      toast.success("Producto eliminado con éxito", {
        position: "top-right",
        style: { backgroundColor: "#00C853", color: "#FFF" },
      });
      await fetchProducts();
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      toast.error("Error al eliminar el producto", {
        position: "top-center",
        style: { backgroundColor: "#FF0000", color: "#FFF" },
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <p className="text-center text-yellow-400">Cargando productos...</p>;
  }

  return (
    <div className="p-6 bg-black min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-yellow-400">Gestión de Productos</h1>
        <div className="flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle className="text-yellow-400 text-center">
                Agregar Producto
              </DialogTitle>
              <AddProductDialog
                onSave={handleAddSave}
                onClose={() => console.log("Modal cerrado")}
              />
            </DialogContent>
          </Dialog>

          <Link
            href="/admin/dashboard"
            className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-lg p-4 flex flex-col items-center text-center"
          >
            <Image
              src={product.imageUrl || "/placeholder-image.png"}
              alt={product.name || "Producto"}
              width={96}
              height={96}
              className="h-24 w-24 object-contain mb-4"
            />
            <h2 className="text-lg font-bold text-black">
              {product.name || "Sin nombre"}
            </h2>
            <p className="text-sm text-gray-500">
              {product.description || "Sin descripción"}
            </p>
            <p className="text-yellow-400 font-bold">
              S/. {(product.price ?? 0).toFixed(2)}
            </p>
            <p className="text-sm text-green-500">
              {product.discount > 0 ? `Descuento: ${product.discount}%` : " "}
            </p>
            <p className="text-sm text-gray-500">
              Stock: {product.stock ?? "Sin stock"}
            </p>
            <div className="flex gap-4 mt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="bg-yellow-400 text-black hover:bg-yellow-500"
                    onClick={() => setSelectedProduct(product)}
                  >
                    Editar
                  </Button>
                </DialogTrigger>
                {selectedProduct?.id === product.id && (
                  <DialogContent>
                    <DialogTitle className="text-yellow-400 text-center">
                      Editar Producto
                    </DialogTitle>
                    <EditProductDialog
                      product={selectedProduct}
                      onSave={handleEditSave}
                      onClose={() => setSelectedProduct(null)}
                    />
                  </DialogContent>
                )}
              </Dialog>
              <Button
                onClick={() => handleDelete(product.id)}
                className={`bg-red-500 text-white hover:bg-red-600 ${
                  actionLoading === product.id ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={actionLoading === product.id}
              >
                {actionLoading === product.id ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
