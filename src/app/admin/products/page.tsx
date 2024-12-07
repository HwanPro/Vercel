"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import Link from "next/link";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import AddProductDialog from "@/components/AddProductDialog";
import EditProductDialog from "@/components/EditProductDialog";

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Error al obtener los productos");

        const data = await response.json();
        setProducts(
          data.map((product: any) => ({
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
        toast.error("Error al obtener los productos");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    const confirm = window.confirm(
      "¿Estás seguro de que deseas eliminar este producto?"
    );
    if (!confirm) return;

    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar el producto");

      setProducts((prev) => prev.filter((product) => product.id !== id));
      toast.success("Producto eliminado con éxito");
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      toast.error("Error al eliminar el producto");
    }
  };

  const handleEditSave = async (updatedProduct: Product) => {
    try {
      console.log("Datos enviados al servidor:", updatedProduct);

      const response = await fetch(`/api/products/${updatedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: updatedProduct.id,
          item_name: updatedProduct.name,
          item_description: updatedProduct.description,
          item_price: updatedProduct.price,
          item_discount: updatedProduct.discount,
          item_stock: updatedProduct.stock,
          item_image_url: updatedProduct.imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error del servidor:", errorData);
        throw new Error(
          errorData.message || "Error desconocido en el servidor"
        );
      }

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      setProducts((prev) =>
        prev.map((product) =>
          product.id === data.item_id
            ? {
                ...product,
                name: data.item_name,
                description: data.item_description,
                price: data.item_price,
                discount: data.item_discount,
                stock: data.item_stock,
                imageUrl: data.item_image_url,
              }
            : product
        )
      );
      toast.success("Producto actualizado con éxito");
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar el producto"
      );
    }
  };

  const handleAddSave = (newProduct: NewProduct) => {
    setProducts((prev) => [
      ...prev,
      {
        ...newProduct,
        id: crypto.randomUUID(),
      },
    ]);
    toast.success("Producto agregado con éxito");
  };

  if (loading) {
    return <p className="text-center text-yellow-400">Cargando productos...</p>;
  }

  return (
    <div className="p-6 bg-black min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-yellow-400">
          Gestión de Productos
        </h1>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
            {product.discount > 0 && (
              <p className="text-sm text-green-500">
                Descuento: {product.discount}%
              </p>
            )}
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
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
