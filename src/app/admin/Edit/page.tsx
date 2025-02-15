"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Pencil, Trash2, Upload, Plus, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

interface Story {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  benefits: string[];
}

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState("stories");
  const [stories, setStories] = useState<Story[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch("/api/gallery");
        const data = await res.json();
        setGalleryImages(data.map((img: { url: string }) => img.url));
      } catch (error) {
        console.error("Error al obtener imágenes:", error);
      }
    };
    fetchGallery();
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        const data = await res.json();
        setPlans(data);
      } catch (error) {
        console.error("Error al obtener planes:", error);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch("/api/stories");
        const data = await res.json();
        setStories(data);
      } catch (error) {
        console.error("Error al obtener stories:", error);
      }
    };
    fetchStories();
  }, []);

  const handleCreateStory = async (
    title: string,
    description: string,
    imageUrl: string,
    link?: string
  ) => {
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: description, imageUrl, link }),
      });

      if (!res.ok) throw new Error("Error al crear la historia");

      const newStory = await res.json();
      setStories((prevStories) => [newStory, ...prevStories]);
      toast({
        title: "Historia creada",
        description: "La historia fue agregada con éxito",
        variant: "default",
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

  const handleCreatePlan = async (
    name: string,
    price: number,
    benefits: string[]
  ) => {
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, benefits }),
      });

      if (!res.ok) throw new Error("Error al crear el plan");

      const newPlan = await res.json();
      setPlans((prev) => [newPlan, ...prev]);
      toast({
        title: "Plan creado",
        description: "El plan fue agregado con éxito",
        variant: "default",
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
      setGalleryImages((prev) => [...prev, data.url]); // suponiendo que devuelve la URL
      toast({
        title: "Imagen subida",
        description: "La imagen fue agregada con éxito",
        variant: "default",
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

  const handleStoryDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(stories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setStories(items);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">
        Gestión de Contenido
      </h1>

      <Tabs
        defaultValue="stories"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-3 bg-black text-yellow-400">
          <TabsTrigger
            value="stories"
            className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
          >
            Noticias y Promociones
          </TabsTrigger>
          <TabsTrigger
            value="plans"
            className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
          >
            Planes de Membresía
          </TabsTrigger>
          <TabsTrigger
            value="gallery"
            className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
          >
            Galería de Fotos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stories" className="mt-6">
          <Card className="bg-white ">
            <CardHeader>
              <div className="flex justify-between items-center text-white">
                <CardTitle className="text-yellow-500">
                  Noticias y Promociones
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
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" className="bg-white" />
                      </div>
                      <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" className="bg-white" />
                      </div>
                      <div>
                        <Label htmlFor="link">Enlace (opcional)</Label>
                        <Input id="link" className="bg-white" />
                      </div>
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
                            width={300} // o el tamaño que prefieras
                            height={192} // ajustado para mantener el aspecto
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
                        onClick={() =>
                          handleCreateStory(
                            "Título ejemplo",
                            "Descripción de ejemplo",
                            imagePreview || "/placeholder.jpg",
                            "https://link-ejemplo.com"
                          )
                        }
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
              <DragDropContext onDragEnd={handleStoryDragEnd}>
                <Droppable droppableId="stories" direction="horizontal">
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
                                    <p className="text-sm text-gray-300 mt-2">
                                      {story.description}
                                    </p>
                                    <div className="flex gap-2 mt-4">
                                      <Button size="icon" variant="outline">
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button size="icon" variant="destructive">
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

        <TabsContent value="plans" className="mt-6">
          <Card className="bg-white border-yellow-400">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-yellow-400">
                  Planes de Membresía
                </CardTitle>
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
                        <Label htmlFor="plan-benefits">
                          Beneficios (uno por línea)
                        </Label>
                        <Textarea id="plan-benefits" className="bg-white" />
                      </div>
                      <Button className="w-full bg-yellow-400 text-black hover:bg-yellow-500">
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
                      <ul className="mt-4 space-y-2">
                        {plan.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="text-yellow-400">•</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2 mt-4">
                        <Button size="icon" variant="outline">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive">
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
                    <Button className="w-full bg-yellow-400 text-black hover:bg-yellow-500">
                      Subir Imágenes
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
                        onClick={() => {
                          const newImages = [...galleryImages];
                          newImages.splice(index, 1);
                          setGalleryImages(newImages);
                        }}
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
