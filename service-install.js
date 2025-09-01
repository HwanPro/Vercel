// service-install.ts (si es JS puro igual funciona pero mejor migrar a .ts o .mjs)

import path from "path";
import { Service } from "node-windows";

const svc = new Service({
  name: "WolfGym Fingerprint Service",
  description: "Servicio que inicia el servidor de huellas (FastAPI) al iniciar Windows",
  script: path.join(__dirname, "windows-service.js"),
  wait: 1,
  grow: 0.5,
  maxRetries: 40,
});

svc.on("install", () => {
  console.log("Servicio instalado. Iniciando...");
  svc.start();
});

svc.on("alreadyinstalled", () => console.log("El servicio ya está instalado."));
svc.on("start", () => console.log("Servicio iniciado."));
svc.on("error", (err) => console.error("Error del servicio:", err));

svc.install();
