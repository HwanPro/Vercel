"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  Folder,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Eye,
  Copy,
  Check,
  Lock,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
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

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const card: React.CSSProperties = {
  background: "#141414",
  border: "1px solid rgba(255,194,26,0.12)",
  borderRadius: 14,
};

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(255,194,26,0.6)",
  margin: 0,
};

export default function ImagesAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [images, setImages] = useState<S3Image[]>([]);
  const [folders, setFolders] = useState<FolderStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [permissionLoading, setPermissionLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/s3-images", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Error al cargar imágenes");
      const data = await response.json();
      setImages(data.images || []);
      setFolders(data.folders || []);
    } catch (error) {
      console.error("Error cargando imágenes:", error);
      toast.error("Error al cargar las imágenes");
    } finally {
      setLoading(false);
    }
  };

  const checkBucketPermissions = async () => {
    try {
      const response = await fetch("/api/admin/s3-permissions", {
        credentials: "include",
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setIsPublic(
          data.policy?.Statement?.some(
            (stmt: { Effect: string; Principal: string }) =>
              stmt.Effect === "Allow" && stmt.Principal === "*",
          ) || false,
        );
      }
    } catch (error) {
      console.error("Error verificando permisos:", error);
    }
  };

  useEffect(() => {
    fetchImages();
    checkBucketPermissions();
  }, []);

  const updateBucketPermissions = async (makePublic: boolean) => {
    setPermissionLoading(true);
    try {
      const response = await fetch("/api/admin/s3-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: makePublic ? "make-public" : "make-private" }),
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setIsPublic(makePublic);
        toast.success(data.message);
        fetchImages();
      } else {
        toast.error(data.error || "Error configurando permisos");
      }
    } catch (error) {
      console.error("Error configurando permisos:", error);
      toast.error("Error configurando permisos del bucket");
    } finally {
      setPermissionLoading(false);
    }
  };

  const filteredImages = images.filter((img) => {
    const matchesSearch = img.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === "all" || img.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success("URL copiada al portapapeles");
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      toast.error("Error al copiar URL");
    }
  };

  const deleteImage = async (key: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta imagen?")) return;
    try {
      const response = await fetch("/api/admin/s3-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Error al eliminar imagen");
      toast.success("Imagen eliminada correctamente");
      fetchImages();
    } catch (error) {
      console.error("Error eliminando imagen:", error);
      toast.error("Error al eliminar la imagen");
    }
  };

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0A0A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.4)",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        Cargando...
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0A0A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#E5484D",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        No autorizado
      </div>
    );
  }

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
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

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
          <p style={eyebrow}>Almacenamiento · AWS S3</p>
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
            ADMINISTRADOR DE IMÁGENES
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
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
            onClick={fetchImages}
            disabled={loading}
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
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            <RefreshCw style={{ width: 14, height: 14, animation: loading ? "spin 1s linear infinite" : "none" }} />
            Actualizar
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Bucket permissions card */}
        <div
          style={{
            ...card,
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: isPublic ? "rgba(46,189,117,0.12)" : "rgba(229,72,77,0.12)",
              color: isPublic ? "#2EBD75" : "#E5484D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Lock style={{ width: 20, height: 20 }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ ...eyebrow, margin: "0 0 4px" }}>Permisos del bucket S3</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
                  fontSize: 20,
                  letterSpacing: "0.02em",
                  color: "#fff",
                }}
              >
                ESTADO ACTUAL:
              </span>
              <span
                style={{
                  padding: "2px 10px",
                  background: isPublic ? "rgba(46,189,117,0.12)" : "rgba(229,72,77,0.12)",
                  border: `1px solid ${isPublic ? "rgba(46,189,117,0.4)" : "rgba(229,72,77,0.4)"}`,
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: isPublic ? "#2EBD75" : "#E5484D",
                }}
              >
                {isPublic ? "PÚBLICO" : "PRIVADO"}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
              {isPublic
                ? "Las imágenes son accesibles públicamente y se mostrarán correctamente."
                : "Las imágenes son privadas y pueden no mostrarse en el navegador."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => updateBucketPermissions(true)}
              disabled={permissionLoading || isPublic}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 36,
                padding: "0 14px",
                background: "rgba(46,189,117,0.12)",
                border: "1px solid rgba(46,189,117,0.4)",
                borderRadius: 8,
                color: "#2EBD75",
                fontSize: 13,
                fontWeight: 600,
                cursor: permissionLoading || isPublic ? "not-allowed" : "pointer",
                opacity: permissionLoading || isPublic ? 0.5 : 1,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {permissionLoading ? <RefreshCw style={{ width: 12, height: 12 }} /> : <Check style={{ width: 12, height: 12 }} />}
              Hacer público
            </button>
            <button
              type="button"
              onClick={() => updateBucketPermissions(false)}
              disabled={permissionLoading || !isPublic}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 36,
                padding: "0 14px",
                background: "rgba(229,72,77,0.10)",
                border: "1px solid rgba(229,72,77,0.4)",
                borderRadius: 8,
                color: "#E5484D",
                fontSize: 13,
                fontWeight: 600,
                cursor: permissionLoading || !isPublic ? "not-allowed" : "pointer",
                opacity: permissionLoading || !isPublic ? 0.5 : 1,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              <Lock style={{ width: 12, height: 12 }} />
              Hacer privado
            </button>
          </div>
        </div>

        {/* Folder stats */}
        {folders.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(folders.length, 4)}, 1fr)`,
              gap: 12,
            }}
          >
            {folders.map((folder) => (
              <div
                key={folder.name}
                style={{
                  ...card,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "rgba(255,194,26,0.10)",
                    color: "#FFC21A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Folder style={{ width: 20, height: 20 }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#FFC21A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {folder.name === "root" ? "Raíz" : folder.name}
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "2px 0 0" }}>
                    {folder.count} archivos · {formatFileSize(folder.totalSize)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search and filter */}
        <div style={{ ...card, padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 14,
                  height: 14,
                  color: "rgba(255,255,255,0.35)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Buscar imágenes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  paddingLeft: 36,
                  paddingRight: 14,
                  background: "#0A0A0A",
                  border: "1px solid rgba(255,194,26,0.15)",
                  borderRadius: 10,
                  color: "#fff",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setSelectedFolder("all")}
                style={{
                  height: 36,
                  padding: "0 14px",
                  background: selectedFolder === "all" ? "#FFC21A" : "transparent",
                  border: selectedFolder === "all" ? "1px solid #FFC21A" : "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  color: selectedFolder === "all" ? "#0A0A0A" : "rgba(255,255,255,0.6)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                Todas
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.name}
                  type="button"
                  onClick={() => setSelectedFolder(folder.name)}
                  style={{
                    height: 36,
                    padding: "0 14px",
                    background: selectedFolder === folder.name ? "#FFC21A" : "transparent",
                    border: selectedFolder === folder.name ? "1px solid #FFC21A" : "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    color: selectedFolder === folder.name ? "#0A0A0A" : "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}
                >
                  {folder.name === "root" ? "Raíz" : folder.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Image grid */}
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2
              style={{
                fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
                fontSize: 24,
                letterSpacing: "0.02em",
                color: "#fff",
                margin: 0,
              }}
            >
              Imágenes ({filteredImages.length})
            </h2>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Ordenar: más recientes</span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <RefreshCw
                style={{
                  width: 32,
                  height: 32,
                  color: "#FFC21A",
                  margin: "0 auto 12px",
                  display: "block",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>Cargando imágenes...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <ImageIcon
                style={{ width: 40, height: 40, color: "rgba(255,255,255,0.2)", margin: "0 auto 12px", display: "block" }}
              />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>No se encontraron imágenes.</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {filteredImages.map((image) => (
                <div
                  key={image.key}
                  style={{
                    background: "#0A0A0A",
                    border: "1px solid rgba(255,194,26,0.10)",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ aspectRatio: "1 / 1", position: "relative", background: "#1C1C1C" }}>
                    <img
                      src={image.url}
                      alt={image.key}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                        if (sibling) sibling.style.display = "flex";
                      }}
                    />
                    <div
                      style={{
                        display: "none",
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "absolute",
                        inset: 0,
                        color: "rgba(255,194,26,0.3)",
                      }}
                    >
                      <ImageIcon style={{ width: 32, height: 32 }} />
                    </div>
                    {/* Folder badge */}
                    <div style={{ position: "absolute", top: 8, left: 8 }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          background: "rgba(10,10,10,0.75)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: 999,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.7)",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {image.folder === "root" ? "Raíz" : image.folder}
                      </span>
                    </div>
                  </div>

                  {/* Info + actions */}
                  <div style={{ padding: "10px 12px" }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        color: "#fff",
                        margin: "0 0 4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={image.key}
                    >
                      {image.key.split("/").pop()}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}>
                      {formatFileSize(image.size)} · {new Date(image.lastModified).toLocaleDateString("es-PE")}
                    </p>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => window.open(image.url, "_blank")}
                        style={{
                          flex: 1,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: 6,
                          color: "rgba(255,255,255,0.6)",
                          fontSize: 11,
                          cursor: "pointer",
                          fontFamily: "'Inter', system-ui, sans-serif",
                        }}
                      >
                        <Eye style={{ width: 10, height: 10 }} />
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(image.url)}
                        style={{
                          flex: 1,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          background: copiedUrl === image.url ? "rgba(46,189,117,0.12)" : "transparent",
                          border: `1px solid ${copiedUrl === image.url ? "rgba(46,189,117,0.4)" : "rgba(255,255,255,0.15)"}`,
                          borderRadius: 6,
                          color: copiedUrl === image.url ? "#2EBD75" : "rgba(255,255,255,0.6)",
                          fontSize: 11,
                          cursor: "pointer",
                          fontFamily: "'Inter', system-ui, sans-serif",
                        }}
                      >
                        {copiedUrl === image.url ? <Check style={{ width: 10, height: 10 }} /> : <Copy style={{ width: 10, height: 10 }} />}
                        Copiar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteImage(image.key)}
                        style={{
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(229,72,77,0.08)",
                          border: "1px solid rgba(229,72,77,0.3)",
                          borderRadius: 6,
                          color: "#E5484D",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 style={{ width: 10, height: 10 }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
