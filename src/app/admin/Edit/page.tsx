"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import { useToast } from "@/ui/use-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Pencil, Trash2, Upload, Plus, X } from "lucide-react";

/** Tipo para historias */
interface Story {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  link?: string;
}

/** Componente principal enfocado sólo en Historias */
export default function StoriesManagement() {
  const { toast } = useToast();

  const [stories, setStories] = useState<Story[]>([]);

  // Dropzone para cargar imagen de la historia
  const [, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        // Validaciones
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

        // Actualiza estado y crea preview
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

  // =============================
  // ========== Fetch =============
  // =============================
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch("/api/stories");
        if (!res.ok) throw new Error("Error al obtener historias");
        const data = await res.json();
        setStories(data);
      } catch (error) {
        console.error("Error al obtener historias:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar las historias",
          variant: "destructive",
        });
      }
    };
    fetchStories();
  }, [toast]);

  // =============================
  // ========== Crear =============
  // =============================
  async function handleCreateStory(
    title: string,
    content: string,
    imageUrl?: string,
    link?: string
  ) {
    try {
      const resp = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, imageUrl, link }),
      });
      if (!resp.ok) throw new Error("Error al crear la historia");

      const newStory = await resp.json();
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
  }

  // =============================
  // ========== Eliminar ==========
  // =============================
  async function handleDeleteStory(id: string) {
    try {
      const resp = await fetch(`/api/stories?id=${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Error al eliminar historia");

      setStories((prev) => prev.filter((s) => s.id !== id));

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

  // =============================
  // ========== Reordenar =========
  // =============================
  function handleDragEnd(result: {
    source: { index: number };
    destination: { index: number } | null;
  }) {
    if (!result.destination) return;
    const items = Array.from(stories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setStories(items);
  }

  // =============================
  // ========== Render ============
  // =============================
  return (
    <div className="min-h-screen bg-black text-white p-6">
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

      <Card className="bg-white">
        <CardHeader>
          <div className="flex justify-between items-center text-white">
            <CardTitle className="text-yellow-500">Historias</CardTitle>

            {/* Botón para crear historia */}
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

                  {/* Dropzone para la imagen */}
                  <p className="text-sm text-gray-600">
                    Sube la imagen (arrastrando o clic).
                  </p>
                  <div
                    {...getRootProps()}
                    className="border-2 border-dashed border-yellow-500 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-500"
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-12 w-12 text-yellow-500" />
                    <p className="mt-2">Arrastra una imagen o haz clic</p>
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
          {/* Reordenar Historias con Drag & Drop */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="stories-list" direction="horizontal">
              {(provided) => (
                <div
                  className="flex gap-4 overflow-x-auto p-4"
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
                          className="w-72 shrink-0"
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
                                {/* Botón para editar historia */}
                                <Button size="icon" variant="outline">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {/* Botón para eliminar historia */}
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  onClick={() => handleDeleteStory(story.id)}
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
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>
    </div>
  );
}
