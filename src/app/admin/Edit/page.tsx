"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import { useToast } from "@/ui/use-toast";
import { ScrollArea } from "@/ui/scroll-area";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Pencil, Trash2, Upload, Plus, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

/** Tipos de datos */
interface News {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  createdAt?: string;
}

interface Story {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  link?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string; // OJO: un string con la descripción
  createdAt?: string;
}

/** Componente principal de Gestión de Contenido */
export default function ContentManagement() {
  const [news, setNews] = useState<News[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { toast } = useToast();

  // ===========================
  // ========== FETCHS =========
  // ===========================

  /** Cargar Noticias (News) */
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error("Error al obtener noticias");
        const data = await res.json();
        setNews(data);
      } catch (error) {
        console.error("Error al obtener noticias:", error);
      }
    };
    fetchNews();
  }, []);

  /** Cargar Historias (Stories) */
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch("/api/stories");
        if (!res.ok) throw new Error("Error al obtener stories");
        const data = await res.json();
        setStories(data);
      } catch (error) {
        console.error("Error al obtener stories:", error);
      }
    };
    fetchStories();
  }, []);

  /** Cargar Planes */
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        if (!res.ok) throw new Error("Error al obtener planes");
        const data = await res.json();
        setPlans(data);
      } catch (error) {
        console.error("Error al obtener planes:", error);
      }
    };
    fetchPlans();
  }, []);

  /** Cargar Galería */
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch("/api/gallery");
        if (!res.ok) throw new Error("Error al obtener imágenes de galería");
        const data = await res.json();
        // Ajusta según tu lógica de response, p. ej. data = [{url:"..."}, ...]
        setGalleryImages(data.map((img: { url: string }) => img.url));
      } catch (error) {
        console.error("Error al obtener imágenes:", error);
      }
    };
    fetchGallery();
  }, []);

  // =================================
  // ========== NEWS (Noticias) =======
  // =================================
  /** Crear Noticia */
  const handleCreateNews = async function handleCreateNews(
    title: string,
    content: string,
    imageUrl?: string
  ) {
    try {
      const resp = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, imageUrl }),
      });
      if (!resp.ok) throw new Error("Error al crear la noticia");
      const newItem = await resp.json();
      setNews((prev) => [newItem, ...prev]);
      toast({ title: "Noticia creada", description: "Se agregó con éxito." });
    } catch (error) {
      console.error("Error al crear noticia:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la noticia",
        variant: "destructive",
      });
    }
  };

  /** Eliminar Noticia */
  const handleDeleteNews = async (id: string) => {
    try {
      const resp = await fetch(`/api/news/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Error al eliminar la noticia");
      setNews((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: "Noticia eliminada",
        description: "Se eliminó con éxito",
      });
    } catch (error) {
      console.error("Error al eliminar noticia:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la noticia",
        variant: "destructive",
      });
    }
  };

  // =================================
  // ========== STORIES ===============
  // =================================
  /** Crear Historia */
  const handleCreateStory = async (
    title: string,
    content: string,
    imageUrl: string,
    link?: string
  ) => {
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, imageUrl, link }),
      });
      if (!res.ok) throw new Error("Error al crear la historia");

      const newStory = await res.json();
      setStories((prev) => [newStory, ...prev]);
      toast({
        title: "Historia creada",
        description: "La historia fue agregada con éxito",
      });
    } catch (error) {
      console.error("Error al crear historia:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la historia",
        variant: "destructive",
      });
    }
  };

  /** Eliminar Historia */
  async function handleDeleteStory(id: string) {
    try {
      const res = await fetch(`/api/stories?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar historia");
      setStories((prev) => prev.filter((story) => story.id !== id));
      toast({
        title: "Historia eliminada",
        description: "Se eliminó con éxito",
      });
    } catch (error) {
      console.error("Error al eliminar historia:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la historia",
        variant: "destructive",
      });
    }
  }

  // =================================
  // ========== PLANS =================
  // =================================
  /** Crear Plan */
  const handleCreatePlan = async (
    name: string,
    price: number,
    description: string
  ) => {
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, description }),
      });
      if (!res.ok) throw new Error("Error al crear plan");

      const newPlan = await res.json();
      setPlans((prev) => [newPlan, ...prev]);
      toast({
        title: "Plan creado",
        description: "El plan fue agregado con éxito",
      });
    } catch (error) {
      console.error("Error al crear plan:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el plan",
        variant: "destructive",
      });
    }
  };

  /** Eliminar Plan */
  const handleDeletePlan = async (id: string) => {
    try {
      const res = await fetch(`/api/plans?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar plan");
      setPlans((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Plan eliminado", description: "Se eliminó con éxito" });
    } catch (error) {
      console.error("Error al eliminar plan:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el plan",
        variant: "destructive",
      });
    }
  };

  // =================================
  // ========== GALLERY ===============
  // =================================
  /** Subir imagen a AWS */
  const handleUploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al subir imagen");

      const data = await res.json();
      setGalleryImages((prev) => [...prev, data.fileUrl]);
      toast({
        title: "Imagen subida",
        description: "La imagen fue agregada con éxito",
      });
    } catch (error) {
      console.error("Error al subir imagen:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    }
  };

  /** Eliminar Imagen */
  const handleDeleteImage = async (index: number) => {
    // 1. Elimina local
    const newImages = [...galleryImages];
    newImages.splice(index, 1);
    setGalleryImages(newImages);
    // 2. (Opcional) Notifica al backend para borrar de S3 o de la BD
    // const res = await fetch(`/api/gallery/xxx`, {method:"DELETE", ...})
    // ...
    toast({ title: "Imagen eliminada", description: "Se eliminó con éxito" });
  };

  // ==========================
  // Drag & Drop para imágenes
  // ==========================
  const [loading, setLoading] = useState(false);
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Error",
            description: "La imagen debe ser menor a 5MB",
            variant: "destructive",
          });
          return;
        }
        if (!file.type.includes("image/")) {
          toast({
            title: "Error",
            description: "El archivo debe ser una imagen (jpg o png)",
            variant: "destructive",
          });
          return;
        }
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  // ==========================
  // Render Componente
  // ==========================
  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">
          Gestión de Contenido
        </h1>
        <Link
          href="/admin/dashboard"
          className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
        >
          Volver al Dashboard
        </Link>
      </div>

      <Tabs defaultValue="news" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-black text-yellow-400">
          <TabsTrigger
            value="news"
            className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
          >
            Noticias
          </TabsTrigger>
          <TabsTrigger
            value="stories"
            className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
          >
            Historias
          </TabsTrigger>
          <TabsTrigger
            value="plans"
            className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
          >
            Planes
          </TabsTrigger>
          <TabsTrigger
            value="gallery"
            className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
          >
            Galería
          </TabsTrigger>
        </TabsList>

        {/* ===================================== */}
        {/* ============== NOTICIAS ============= */}
        {/* ===================================== */}
        <TabsContent value="news" className="mt-6">
          <Card className="bg-white">
            <CardHeader>
              <div className="flex justify-between items-center text-white">
                <CardTitle className="text-yellow-500">Noticias</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-yellow-500 text-black hover:bg-yellow-500">
                      <Plus className="mr-2 h-4 w-4" /> Nueva Noticia
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-yellow-500">
                    <DialogHeader>
                      <DialogTitle className="text-yellow-500">
                        Crear Nueva Noticia
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="news-title">Título</Label>
                        <Input id="news-title" className="bg-white" />
                      </div>
                      <div>
                        <Label htmlFor="news-content">Contenido</Label>
                        <Textarea id="news-content" className="bg-white" />
                      </div>
                      {/* Imagen opcional */}
                      <div>
                        <Label htmlFor="news-image">
                          URL de imagen (opcional)
                        </Label>
                        <Input id="news-image" className="bg-white" />
                      </div>
                      {/* Botón para crear */}
                      <Button
                        className="w-full bg-yellow-500 text-black hover:bg-yellow-500"
                        onClick={async () => {
                          const title = (
                            document.getElementById(
                              "news-title"
                            ) as HTMLInputElement
                          ).value;
                          const content = (
                            document.getElementById(
                              "news-content"
                            ) as HTMLTextAreaElement
                          ).value;
                          const imageUrl = (
                            document.getElementById(
                              "news-image"
                            ) as HTMLInputElement
                          ).value;
                          await handleCreateNews(title, content, imageUrl);
                        }}
                      >
                        Guardar Noticia
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {news.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {news.map((item) => (
                    <Card key={item.id} className="bg-white border-yellow-400">
                      <CardContent className="p-4">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            width={300}
                            height={200}
                            className="w-full h-48 object-cover rounded-lg mb-4"
                          />
                        ) : (
                          <div className="bg-gray-300 w-full h-48 mb-4 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-gray-600">
                              Sin imagen
                            </span>
                          </div>
                        )}
                        <h3 className="font-semibold text-yellow-400">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">
                          {item.content}
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="icon"
                            variant="outline"
                            // TODO: onClick => Edit modal
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDeleteNews(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-yellow-400">No hay noticias disponibles.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================================== */}
        {/* ============ HISTORIAS ============== */}
        {/* ===================================== */}
        <TabsContent value="stories" className="mt-6">
          <Card className="bg-white">
            <CardHeader>
              <div className="flex justify-between items-center text-white">
                <CardTitle className="text-yellow-500">
                  Historias (Promociones)
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-yellow-500 text-black hover:bg-yellow-500">
                      <Plus className="mr-2 h-4 w-4" /> Nueva Historia
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-yellow-500">
                    <DialogHeader>
                      <DialogTitle className="text-yellow-500">
                        Crear Nueva Historia
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="story-title">Título</Label>
                        <Input id="story-title" className="bg-white" />
                      </div>
                      <div>
                        <Label htmlFor="story-content">Contenido</Label>
                        <Textarea id="story-content" className="bg-white" />
                      </div>
                      <div>
                        <Label htmlFor="story-link">Link (opcional)</Label>
                        <Input id="story-link" className="bg-white" />
                      </div>
                      {/* Subir imagen manual (URL) o con dropzone,
                          en este ejemplo iremos con dropzone */}
                      <p className="text-sm text-gray-600">
                        Sube la imagen en la parte inferior de la ventana
                        (Dropzone).
                      </p>

                      <div
                        {...getRootProps()}
                        className="border-2 border-dashed border-yellow-500 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-500"
                      >
                        <input {...getInputProps()} />
                        <Upload className="mx-auto h-12 w-12 text-yellow-500" />
                        <p className="mt-2">
                          Arrastra una imagen o haz clic para seleccionar
                        </p>
                        <p className="text-sm text-gray-500">
                          JPG o PNG, máximo 5MB
                        </p>
                      </div>
                      {imagePreview && (
                        <div className="relative">
                          <Image
                            src={imagePreview || "/placeholder.jpg"}
                            alt="Preview"
                            width={300}
                            height={192}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      <Button
                        onClick={() => {
                          const title = (
                            document.getElementById(
                              "story-title"
                            ) as HTMLInputElement
                          ).value;
                          const content = (
                            document.getElementById(
                              "story-content"
                            ) as HTMLTextAreaElement
                          ).value;
                          const link = (
                            document.getElementById(
                              "story-link"
                            ) as HTMLInputElement
                          ).value;
                          handleCreateStory(
                            title,
                            content,
                            imagePreview || "/placeholder.jpg",
                            link || undefined
                          );
                        }}
                        className="w-full bg-yellow-500 text-black hover:bg-yellow-500"
                      >
                        Guardar Historia
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {/* Sección Drag & Drop de las historias */}
              <DragDropContext
                onDragEnd={(result) => {
                  if (!result.destination) return;
                  const items = Array.from(stories);
                  const [reorderedItem] = items.splice(result.source.index, 1);
                  items.splice(result.destination.index, 0, reorderedItem);
                  setStories(items);
                }}
              >
                <Droppable droppableId="stories-list" direction="horizontal">
                  {(provided) => (
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border border-yellow-500">
                      <div
                        className="inline-flex gap-4 p-4"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {stories.map((story, index) => (
                          <Draggable
                            key={story.id}
                            draggableId={story.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="w-72"
                              >
                                <Card className="bg-white border-yellow-400">
                                  <CardContent className="p-4">
                                    <Image
                                      src={story.imageUrl || "/placeholder.jpg"}
                                      alt={story.title}
                                      width={300}
                                      height={192}
                                      className="w-full h-48 object-cover rounded-lg mb-4"
                                    />
                                    <h3 className="font-semibold text-yellow-400">
                                      {story.title}
                                    </h3>
                                    <p className="text-sm text-gray-700 mt-2">
                                      {story.content}
                                    </p>
                                    {story.link && (
                                      <p className="text-xs text-blue-600 mt-1 underline">
                                        {story.link}
                                      </p>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                      {/* Botón para editar */}
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        // TODO: abrir modal de edición
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      {/* Botón para eliminar */}
                                      <Button
                                        size="icon"
                                        variant="destructive"
                                        onClick={() =>
                                          handleDeleteStory(story.id)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </ScrollArea>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================================== */}
        {/* ============ PLANES ================== */}
        {/* ===================================== */}
        <TabsContent value="plans" className="mt-6">
          <Card className="bg-white border-yellow-400">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-yellow-400">Planes</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
                      <Plus className="mr-2 h-4 w-4" /> Nuevo Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-yellow-400">
                    <DialogHeader>
                      <DialogTitle className="text-yellow-400">
                        Crear Nuevo Plan
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="plan-name">Nombre del Plan</Label>
                        <Input id="plan-name" className="bg-white" />
                      </div>
                      <div>
                        <Label htmlFor="plan-price">Precio (S/)</Label>
                        <Input
                          id="plan-price"
                          type="number"
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="plan-desc">Descripción</Label>
                        <Textarea id="plan-desc" className="bg-white" />
                      </div>

                      <Button
                        className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                        onClick={() => {
                          const name = (
                            document.getElementById(
                              "plan-name"
                            ) as HTMLInputElement
                          ).value;
                          const priceString = (
                            document.getElementById(
                              "plan-price"
                            ) as HTMLInputElement
                          ).value;
                          const description = (
                            document.getElementById(
                              "plan-desc"
                            ) as HTMLTextAreaElement
                          ).value;
                          const price = parseFloat(priceString);

                          handleCreatePlan(name, price, description);
                        }}
                      >
                        Guardar Plan
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <Card key={plan.id} className="bg-white border-yellow-400">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-yellow-400">
                        {plan.name}
                      </h3>
                      <p className="text-2xl font-bold mt-2">S/ {plan.price}</p>
                      <p className="mt-4 text-sm text-gray-700">
                        {plan.description}
                      </p>
                      <div className="flex gap-2 mt-4">
                        {/* Botón editar plan (se abre modal) */}
                        <Button
                          size="icon"
                          variant="outline"
                          // TODO: Abrir modal para editar plan
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {/* Botón eliminar plan */}
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================================== */}
        {/* ============ GALERÍA ================ */}
        {/* ===================================== */}
        <TabsContent value="gallery" className="mt-6">
          <Card className="bg-white border-yellow-400">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-yellow-400">
                  Galería de Fotos
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
                      <Upload className="mr-2 h-4 w-4" /> Subir Imágenes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-yellow-400">
                    <DialogHeader>
                      <DialogTitle className="text-yellow-400">
                        Subir Imágenes
                      </DialogTitle>
                    </DialogHeader>

                    <div
                      {...getRootProps()}
                      className="border-2 border-dashed border-yellow-400 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-500"
                    >
                      <input {...getInputProps()} />
                      <Upload className="mx-auto h-12 w-12 text-yellow-400" />
                      <p className="mt-2">
                        Arrastra imágenes o haz clic para seleccionar
                      </p>
                      <p className="text-sm text-gray-400">
                        JPG o PNG, máximo 5MB por imagen
                      </p>
                    </div>
                    {imagePreview && (
                      <div className="relative">
                        <Image
                          src={imagePreview || "/placeholder.jpg"}
                          alt="Preview"
                          width={300}
                          height={192}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {/* Botón para subir la imagen a AWS */}
                    <Button
                      className="w-full bg-yellow-400 text-black hover:bg-yellow-500 mt-4"
                      onClick={async () => {
                        if (!selectedImage) {
                          toast({
                            title: "Error",
                            description: "No has seleccionado ninguna imagen",
                            variant: "destructive",
                          });
                          return;
                        }
                        setLoading(true);
                        await handleUploadImage(selectedImage);
                        setSelectedImage(null);
                        setImagePreview(null);
                        setLoading(false);
                      }}
                      disabled={loading}
                    >
                      {loading ? "Subiendo..." : "Subir Imágenes"}
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={image || "/placeholder.jpg"}
                      alt={`Gallery ${index + 1}`}
                      width={300}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="transform scale-0 group-hover:scale-100 transition-transform"
                        onClick={() => handleDeleteImage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
