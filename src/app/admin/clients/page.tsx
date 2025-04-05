// src/app/admin/clients/page.tsx

"use client";

import ConfirmDialog from "@/ui/components/ConfirmDialog";
import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/ui/dialog";
import AddClientDialog from "@/features/clients/AddClientDialog";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditClientDialog from "@/features/clients/EditClientDialog";

// Define el tipo para los datos del cliente
interface Client {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  plan: string;
  membershipStart: string;
  membershipEnd: string;
  phone: string;
  emergencyPhone: string;
  prodfile_adress: string;
  profile_social: string;
  hasPaid: boolean;
  password?: string; // ⚠️ Opcional porque solo existe al crear
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const [pendingCredentials, setPendingCredentials] = useState<
    Array<{ username: string; password: string; phone: string }>
  >([]);

  useEffect(() => {
    const stored = localStorage.getItem("pendingCredentials");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPendingCredentials(
            parsed.filter(
              (cred: { username: string; password: string; phone: string }) =>
                cred != null
            )
          );
        }
      } catch (error) {
        console.error("Error al parsear pendingCredentials:", error);
      }
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pendingCredentials") {
        const stored = localStorage.getItem("pendingCredentials");
        setPendingCredentials(stored ? JSON.parse(stored) : []);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Fetch Clients from API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Error al obtener los clientes");

        const data = await response.json();

        // Filtrar usuarios que no sean administradores
        const filteredClients = data.filter(
          (client: { user: { role: string } }) => client.user.role !== "admin" // Asegúrate de que client.user.role exista
        );

        // Mapear y sanitizar los datos
        const sanitizedData: Client[] = filteredClients.map(
          (client: {
            profile_id: string;
            profile_username: string;
            profile_first_name?: string;
            profile_last_name?: string;
            profile_plan?: string;
            profile_start_date?: string;
            profile_end_date?: string;
            profile_phone?: string;
            profile_emergency_phone?: string;
            profile_adress?: string;
            profile_social?: string;
            user: {
              role: string;
            };
          }) => {
            const membershipStart = client.profile_start_date
              ? new Date(client.profile_start_date)
              : null;
            const membershipEnd = client.profile_end_date
              ? new Date(client.profile_end_date)
              : null;

            return {
              id: client.profile_id,
              userName: client.profile_username || "",
              firstName: client.profile_first_name || "Sin nombre",
              lastName: client.profile_last_name || "Sin apellido",
              plan: client.profile_plan || "Sin plan",
              membershipStart: membershipStart
                ? membershipStart.toISOString().split("T")[0]
                : "",
              membershipEnd: membershipEnd
                ? membershipEnd.toISOString().split("T")[0]
                : "",
              phone: client.profile_phone || "",
              emergencyPhone: client.profile_emergency_phone || "",
              prodfile_adress: client.profile_adress || "",
              profile_social: client.profile_social || "",
              hasPaid: false,
            };
          }
        );

        setClients(sanitizedData);
        setFilteredClients(sanitizedData);
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        toast.error("Error al cargar clientes. Inténtelo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Search Filter
  useEffect(() => {
    const filter = clients.filter((client) =>
      `${client.firstName} ${client.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

    setFilteredClients(filter);
  }, [searchQuery, clients]);

  // Handle Delete Click
  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setShowConfirm(true);
  };

  // Confirm Delete Logic
  const confirmDelete = async () => {
    if (!clientToDelete) {
      toast.error("No se pudo identificar al cliente a eliminar.");
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar el cliente");
      }

      setClients((prev) =>
        prev.filter((client) => client.id !== clientToDelete)
      );
      setFilteredClients((prev) =>
        prev.filter((client) => client.id !== clientToDelete)
      );
      toast.success("Cliente eliminado con éxito.");
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      toast.error("Error al eliminar cliente. Inténtelo más tarde.");
    } finally {
      setShowConfirm(false);
      setClientToDelete(null);
    }
  };

  // Loading State
  if (loading) {
    return <p className="text-center text-yellow-400">Cargando clientes...</p>;
  }

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <ToastContainer />
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">
          Gestión de Clientes
        </h1>
        <Link
          href="/admin/dashboard"
          className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 w-full md:w-auto text-center"
        >
          Volver al Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <input
          type="text"
          className="p-2 rounded border w-full md:max-w-sm text-black"
          placeholder="Buscar cliente por nombre o apellido"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500 w-full md:w-auto">
              Añadir Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <DialogTitle className="text-black text-lg font-bold mb-4">
              Registrar Nuevo Cliente
            </DialogTitle>
            <AddClientDialog
              onSave={(newClient) => {
                // newClient NO tiene "id"
                const clientWithId: Client = {
                  prodfile_adress: "",
                  profile_social: "",
                  ...newClient,
                  id: Math.random().toString(36).substr(2, 9),
                };
                setClients((prev) => [...prev, clientWithId]);
                toast.success("Cliente agregado con éxito.");
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <Table className="table-auto w-full border-collapse">
          <TableHeader>
            <TableRow>
              <TableHead className="text-yellow-400 w-1/6">Nombre</TableHead>
              <TableHead className="text-yellow-400 w-1/6">Apellidos</TableHead>
              <TableHead className="text-yellow-400 w-1/6">Plan</TableHead>
              <TableHead className="text-yellow-400 w-1/6">
                Fecha de Inicio
              </TableHead>
              <TableHead className="text-yellow-400 w-1/6">
                Fecha de Fin
              </TableHead>
              <TableHead className="text-yellow-400 w-1/6">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-gray-700">
                  <TableCell>{client.firstName}</TableCell>
                  <TableCell>{client.lastName}</TableCell>
                  <TableCell>{client.plan}</TableCell>
                  <TableCell>{client.membershipStart}</TableCell>
                  <TableCell>{client.membershipEnd}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {/* EJEMPLO: EditClientDialog */}
                      <EditClientDialog
                        client={{ ...client, email: client.userName }}
                        onUpdate={(updated) => {
                          setClients((prev) =>
                            prev.map((c) =>
                              c.id === updated.id ? { ...c, ...updated } : c
                            )
                          );
                          toast.success("Cliente actualizado");
                        }}
                      />
                      <Button
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => handleDeleteClick(client.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No hay clientes disponibles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-8 p-4 border rounded bg-gray-100 text-black">
        <h2 className="text-xl font-bold mb-4">Credenciales Pendientes</h2>
        {pendingCredentials.length > 0 ? (
          pendingCredentials.map((cred, index) => (
            <div key={index} className="mb-2 p-2 border rounded">
              <p>
                <span className="font-bold">Usuario:</span> {cred.username}
              </p>
              <p>
                <span className="font-bold">Contraseña:</span> {cred.password}
              </p>
              <p>
                <span className="font-bold">Teléfono:</span> {cred.phone}
              </p>
              <div className="flex gap-2 mt-1">
                <Button
                  className="bg-green-600 text-white text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Usuario: ${cred.username}\nContraseña: ${cred.password}\nTeléfono: ${cred.phone}`
                    );
                    toast.success("Credenciales copiadas al portapapeles.");
                  }}
                >
                  Copiar
                </Button>
                <Button
                  className="bg-green-600 text-white w-50 mb-2"
                  onClick={() => {
                    window.open(`https://wa.me/${cred.phone}`, "_blank");
                  }}
                >
                  Abrir chat en WhatsApp
                </Button>
                <Button
                  className="bg-red-500 text-white text-xs"
                  onClick={() => {
                    // Eliminar la credencial del array y actualizar localStorage
                    const updated = pendingCredentials.filter(
                      (_, i) => i !== index
                    );
                    localStorage.setItem(
                      "pendingCredentials",
                      JSON.stringify(updated)
                    );
                    setPendingCredentials(updated);
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p>No hay credenciales pendientes.</p>
        )}
        <p className="mt-4 text-center italic">
          &ldquo;El éxito es la suma de pequeños esfuerzos repetidos día tras
          día.&rdquo;
        </p>
      </div>
      {showConfirm && (
        <ConfirmDialog
          message="¿Estás seguro de que deseas eliminar este cliente?"
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
