"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import Link from "next/link";
import { 
  Search, 
  Folder, 
  Image as ImageIcon, 
  Trash2, 
  Download, 
  RefreshCw,
  Eye,
  Copy,
  Check,
  Lock
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface S3Image {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  folder: string;
}

interface FolderStats {
  name: string;
  count: number;
  totalSize: number;
}

export default function ImagesAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [images, setImages] = useState<S3Image[]>([]);
  const [folders, setFolders] = useState<FolderStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [bucketPolicy, setBucketPolicy] = useState<any>(null);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [permissionLoading, setPermissionLoading] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  // Cargar imágenes
  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/s3-images", {
        credentials: "include",
        cache: "no-store"
      });
      
      if (!response.ok) {
        throw new Error("Error al cargar imágenes");
      }
      
      const data = await response.json();
      setImages(data.images || []);
      setFolders(data.folders || []);
    } catch (error) {
      console.error("Error cargando imágenes:", error);
      toast.error("❌ Error al cargar las imágenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    checkBucketPermissions();
  }, []);

  // Verificar permisos del bucket
  const checkBucketPermissions = async () => {
    try {
      const response = await fetch("/api/admin/s3-permissions", {
        credentials: "include",
        cache: "no-store"
      });
      
      if (response.ok) {
        const data = await response.json();
        setBucketPolicy(data.policy);
        setIsPublic(data.policy?.Statement?.some((stmt: any) => 
          stmt.Effect === "Allow" && stmt.Principal === "*"
        ) || false);
      }
    } catch (error) {
      console.error("Error verificando permisos:", error);
    }
  };

  // Configurar permisos del bucket
  const updateBucketPermissions = async (makePublic: boolean) => {
    setPermissionLoading(true);
    try {
      const response = await fetch("/api/admin/s3-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: makePublic ? "make-public" : "make-private" 
        }),
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsPublic(makePublic);
        toast.success(data.message);
        // Recargar imágenes para verificar que se muestran
        fetchImages();
      } else {
        toast.error(data.error || "Error configurando permisos");
      }
    } catch (error) {
      console.error("Error configurando permisos:", error);
      toast.error("❌ Error configurando permisos del bucket");
    } finally {
      setPermissionLoading(false);
    }
  };

  // Filtrar imágenes
  const filteredImages = images.filter(img => {
    const matchesSearch = img.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === "all" || img.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Copiar URL al portapapeles
  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success("✅ URL copiada al portapapeles");
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error("❌ Error al copiar URL");
    }
  };

  // Eliminar imagen
  const deleteImage = async (key: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta imagen?")) return;
    
    try {
      const response = await fetch("/api/admin/s3-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Error al eliminar imagen");
      }
      
      toast.success("✅ Imagen eliminada correctamente");
      fetchImages(); // Recargar lista
    } catch (error) {
      console.error("Error eliminando imagen:", error);
      toast.error("❌ Error al eliminar la imagen");
    }
  };

  if (status === "loading") {
    return <div className="p-6 text-white">Cargando...</div>;
  }

  if (!session || session.user?.role !== "admin") {
    return <div className="p-6 text-white">No autorizado</div>;
  }

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              Administrador de Imágenes AWS S3
            </h1>
            <p className="text-gray-400">
              Gestiona las imágenes almacenadas en tu bucket de S3
            </p>
          </div>
          <Button
            onClick={fetchImages}
            disabled={loading}
            className="bg-yellow-400 text-black hover:bg-yellow-500"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          
          <Link
          href="/admin/dashboard"
          className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 w-full md:w-auto text-center"
        >
          Volver al Dashboard
        </Link>
        
        </div>

        {/* Control de Permisos */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Permisos del Bucket S3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-300 mb-2">
                  Estado actual: <span className={`font-semibold ${isPublic ? 'text-green-400' : 'text-red-400'}`}>
                    {isPublic ? 'Público (lectura)' : 'Privado'}
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  {isPublic 
                    ? 'Las imágenes son accesibles públicamente y se mostrarán correctamente'
                    : 'Las imágenes son privadas y pueden no mostrarse en el navegador'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => updateBucketPermissions(true)}
                  disabled={permissionLoading || isPublic}
                  className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {permissionLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Hacer Público
                </Button>
                <Button
                  onClick={() => updateBucketPermissions(false)}
                  disabled={permissionLoading || !isPublic}
                  variant="destructive"
                  className="disabled:opacity-50"
                >
                  {permissionLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Hacer Privado
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas de carpetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <Card key={folder.name} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Folder className="h-5 w-5 text-yellow-400" />
                  <span className="font-semibold text-yellow-400">
                    {folder.name === "root" ? "Raíz" : folder.name}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  <div>{folder.count} archivos</div>
                  <div>{formatFileSize(folder.totalSize)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar imágenes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedFolder === "all" ? "default" : "outline"}
                  onClick={() => setSelectedFolder("all")}
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  Todas
                </Button>
                {folders.map((folder) => (
                  <Button
                    key={folder.name}
                    variant={selectedFolder === folder.name ? "default" : "outline"}
                    onClick={() => setSelectedFolder(folder.name)}
                    className="bg-yellow-400 text-black hover:bg-yellow-500"
                  >
                    {folder.name === "root" ? "Raíz" : folder.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de imágenes */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400">
              Imágenes ({filteredImages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-yellow-400" />
                <p>Cargando imágenes...</p>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron imágenes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredImages.map((image) => (
                  <Card key={image.key} className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <div className="aspect-square mb-3 bg-gray-600 rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.key}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = "flex";
                            }
                          }}
                        />
                        <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ display: "none" }}>
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-white truncate" title={image.key}>
                          {image.key.split("/").pop()}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {image.folder === "root" ? "Raíz" : image.folder}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatFileSize(image.size)}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          {new Date(image.lastModified).toLocaleDateString()}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(image.url, "_blank")}
                            className="flex-1 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(image.url)}
                            className="flex-1 text-xs"
                          >
                            {copiedUrl === image.url ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            Copiar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteImage(image.key)}
                            className="text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
