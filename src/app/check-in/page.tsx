"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useSession } from "next-auth/react";

const swalBase = {
  background: "#000",
  color: "#fff",
  confirmButtonColor: "#facc15",
} as const;

function vibrate(ms = 100) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch {}
}

type IdentifyResult = { ok: boolean; match: boolean; userId: string | null; name?: string };
type RegisterResult = { 
  ok: boolean; 
  action: "checkin" | "checkout" | "already_open"; 
  fullName?: string; 
  minutesOpen?: number; 
  monthlyDebt?: number;
  dailyDebt?: number;
  totalDebt?: number;
  daysLeft?: number; 
  avatarUrl?: string;
  profileId?: string;
};

type ActivityLog = {
  id: string;
  timestamp: Date;
  fullName: string;
  action: "checkin" | "checkout";
  avatarUrl?: string;
  monthlyDebt: number;
  dailyDebt: number;
  daysLeft?: number;
  profileId?: string;
};

export default function CheckInPage() {
  const { data: session } = useSession();
  
  // ----- modo / sala -----
  const [mode, setMode] = useState<"kiosk" | "remote">("kiosk"); // valor estable para SSR => NO hydration error
  const [room, setRoom] = useState("default");
  const [mounted, setMounted] = useState(false);
  
  // ----- estados para admin -----
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [showDebtDialog, setShowDebtDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<RegisterResult | null>(null);

  // Cargar historial del día desde localStorage al montar
  useEffect(() => {
    if (mounted && session?.user?.role === "admin") {
      const today = new Date().toDateString();
      const savedLog = localStorage.getItem(`activityLog_${today}`);
      if (savedLog) {
        try {
          const parsedLog = JSON.parse(savedLog).map((item: ActivityLog & { timestamp: string }) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
          setActivityLog(parsedLog);
        } catch (error) {
          console.error("Error al cargar historial del día:", error);
        }
      }
    }
  }, [mounted, session?.user?.role]);

  // Guardar historial del día en localStorage cuando cambie
  useEffect(() => {
    if (mounted && session?.user?.role === "admin" && activityLog.length > 0) {
      const today = new Date().toDateString();
      localStorage.setItem(`activityLog_${today}`, JSON.stringify(activityLog));
    }
  }, [activityLog, mounted, session?.user?.role]);

  useEffect(() => {
    setMounted(true);
    const sp = new URLSearchParams(window.location.search);
    setMode(sp.get("remote") ? "remote" : "kiosk");
    setRoom(sp.get("room") || "default");
  }, []);

  // ----- estados captura/escaneo -----
  const [loading, setLoading] = useState(false);
  const scanningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // ==================== utilidades ====================
  const askPhone = async (title: string): Promise<string | null> => {
    const { value, isConfirmed } = await Swal.fire({
      ...swalBase,
      title,
      input: "tel",
      inputPlaceholder: "987654321",
      inputAttributes: { maxlength: "9", pattern: "\\d{9}" },
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      preConfirm: (val) => {
        const v = String(val || "").replace(/\D/g, "");
        if (v.length !== 9) {
          Swal.showValidationMessage("Debe tener exactamente 9 dígitos");
          return false as any;
        }
        return v;
      },
    });
    return isConfirmed ? String(value).replace(/\D/g, "").slice(0, 9) : null;
  };

  const identifyOnce = async (showAnimation = false): Promise<IdentifyResult> => {
    const controller = new AbortController();
    abortRef.current = controller;
    const t = setTimeout(() => controller.abort(), 15000);
    
    // Mostrar animación si se solicita
    if (showAnimation) {
      Swal.fire({
        title: "🔍 Verificando Huella",
        html: `
          <div class="fingerprint-scanner">
            <div class="scanner-animation">
              <div class="pulse-ring"></div>
              <div class="scanner-text">
                <p style="margin: 15px 0 5px 0; font-size: 16px; color: #ffc107;">
                  <span class="spinner">🔄</span> Identificando huella...
                </p>
              </div>
            </div>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        customClass: { popup: 'fingerprint-popup' }
      });
    }
    
    try {
      const r = await fetch("/api/biometric/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({}),
      });
      const j = await r.json().catch(() => ({}));
      clearTimeout(t);
      console.log("Respuesta de identificación:", { status: r.status, data: j });
      
      if (showAnimation) {
        Swal.close();
      }
      
      return {
        ok: r.ok,
        match: Boolean(j?.match),
        userId: j?.userId ?? j?.user_id ?? null,
        name: j?.fullName ?? j?.name,
      };
    } catch (error) {
      clearTimeout(t);
      console.error("Error en identifyOnce:", error);
      
      if (showAnimation) {
        Swal.close();
      }
      
      return { ok: false, match: false, userId: null };
    }
  };

  const register = async (payload: { userId?: string; phone?: string; intent?: "checkout" }) => {
    const r = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const j = (await r.json().catch(() => ({} as RegisterResult))) as RegisterResult;
    if (!r.ok) throw new Error((j as RegisterResult & { message?: string })?.message || "No se pudo registrar la asistencia");
    return j;
  };

  // ==================== acciones principal ====================
  const showCard = async (data: RegisterResult, fallbackName?: string) => {
    const name = (data.fullName || fallbackName || "").trim();
    const isAdmin = session?.user?.role === "admin";
  
    // 👇 coerción robusta (si API manda string por Decimal)
    const monthlyDebtNum = data.monthlyDebt || 0;
    const dailyDebtNum = data.dailyDebt || 0;
    const totalDebtNum = data.totalDebt || 0;
    const daysLeftNum =
      data.daysLeft === null || data.daysLeft === undefined ? undefined : Number(data.daysLeft);
  
    const title =
      data.action === "checkout"
        ? `¡Hasta la próxima${name ? ", " + name : ""}!`
        : `¡Bienvenido${name ? ", " + name : ""}!`;
  
    const avatar =
      data.avatarUrl ||
      "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=" +
        encodeURIComponent(name || "W G");
  
    const html = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${avatar}" style="width:64px;height:64px;border-radius:9999px;object-fit:cover" alt="avatar" />
        <div style="text-align:left">
          ${Number.isFinite(daysLeftNum) ? `<div>Días restantes: <b>${daysLeftNum}</b></div>` : ""}
          ${totalDebtNum > 0 ? `<div>Deuda total: <b>S/. ${totalDebtNum.toFixed(2)}</b></div>` : ""}
          ${isAdmin && monthlyDebtNum > 0 ? `<div>Deuda mensual: <b>S/. ${monthlyDebtNum.toFixed(2)}</b></div>` : ""}
          ${isAdmin && dailyDebtNum > 0 ? `<div>Deuda diaria: <b>S/. ${dailyDebtNum.toFixed(2)}</b></div>` : ""}
          ${
            data.action === "checkout" && Number.isFinite(data.minutesOpen)
              ? `<div>Sesión: ${data.minutesOpen} min</div>`
              : ""
          }
        </div>
      </div>`;

    // Agregar al log de actividad si es admin
    if (isAdmin) {
      const logEntry: ActivityLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        fullName: name,
        action: data.action === "checkout" ? "checkout" : "checkin",
        avatarUrl: data.avatarUrl,
        monthlyDebt: monthlyDebtNum,
        dailyDebt: dailyDebtNum,
        daysLeft: daysLeftNum || undefined,
        profileId: data.profileId,
      };
      setActivityLog(prev => [logEntry, ...prev.slice(0, 49)]); // Mantener últimas 50 entradas
    }
  
    const result = await Swal.fire({
      ...swalBase,
      icon: "success",
      title,
      html,
      timer: isAdmin ? undefined : 2000,
      showConfirmButton: isAdmin && data.action === "checkin",
      confirmButtonText: isAdmin ? "Agregar Deuda" : undefined,
      showCancelButton: isAdmin,
      cancelButtonText: isAdmin ? "Cerrar" : undefined,
    });

    // Si es admin y confirmó, mostrar diálogo de deuda
    if (isAdmin && result.isConfirmed && data.profileId) {
      setSelectedClient(data);
      setShowDebtDialog(true);
    }
  };  

  const startAutoScan = async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setLoading(true);

    // Mostrar diálogo de escaneo con animación mejorada
    Swal.fire({
      ...swalBase,
      title: "🔍 Verificando Huella",
      html: `
        <div class="fingerprint-scanner">
          <div class="scanner-animation">
            <div class="pulse-ring"></div>
            <div class="pulse-ring-2"></div>
            <div class="fingerprint-icon">👆</div>
          </div>
          <div class="scanner-text">
            <p style="margin: 15px 0 5px 0; font-size: 16px; color: #333;">Coloca tu dedo en el ZKT Eco 9500</p>
            <small style="opacity: 0.7; font-size: 13px;">Presiona firmemente y mantén quieto</small>
          </div>
        </div>
        <style>
          .fingerprint-scanner {
            text-align: center;
            padding: 10px;
          }
          .scanner-animation {
            position: relative;
            display: inline-block;
            margin: 10px 0 20px 0;
          }
          .pulse-ring, .pulse-ring-2 {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            border: 3px solid #007bff;
            border-radius: 50%;
            animation: pulse 2s infinite;
          }
          .pulse-ring-2 {
            animation-delay: 1s;
            border-color: #28a745;
          }
          .fingerprint-icon {
            font-size: 40px;
            z-index: 10;
            position: relative;
            animation: bounce 1.5s infinite;
          }
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(0.8);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(1.8);
              opacity: 0;
            }
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinner {
            display: inline-block;
            animation: spin 1s linear infinite;
            margin-right: 8px;
          }
          .fingerprint-popup {
            border-radius: 15px !important;
            box-shadow: 0 8px 25px rgba(0,123,255,0.15) !important;
          }
          .swal2-confirm-custom {
            background-color: #dc3545 !important;
            border-color: #dc3545 !important;
            font-weight: bold !important;
            border-radius: 25px !important;
            padding: 10px 20px !important;
          }
          .swal2-confirm-custom:hover {
            background-color: #c82333 !important;
            border-color: #bd2130 !important;
          }
        </style>
      `,
      allowOutsideClick: true,
      showConfirmButton: true,
      confirmButtonText: "🛑 Detener",
      showCancelButton: false,
      customClass: {
        popup: 'fingerprint-popup',
        confirmButton: 'swal2-confirm-custom'
      },
      didOpen: () => {
        // Configurar evento para el botón de detener
        const confirmButton = document.querySelector('.swal2-confirm');
        if (confirmButton) {
          confirmButton.addEventListener('click', () => {
            scanningRef.current = false;
            setLoading(false);
            Swal.close();
          });
        }
      },
    });

    let matched: IdentifyResult | null = null;
    let attempts = 0;
    const maxAttempts = 4; // Reducido para ZKT Eco 9500
    let noFingerCount = 0;
    const maxNoFingerAttempts = 3; // Máximo 3 veces "no hay dedo"
    
    // Timeout optimizado para ZKT Eco 9500
    const timeoutId = setTimeout(() => {
      console.log("[ZKT Eco 9500] Timeout alcanzado (8s), deteniendo escaneo");
      scanningRef.current = false;
      Swal.close();
    }, 8000);
    
    while (scanningRef.current && attempts < maxAttempts) {
      if (!scanningRef.current) break; // Verificar si se detuvo
      
      // Obtener referencia al contenedor una sola vez
      const swalContainer = document.querySelector('.fingerprint-scanner');
      
      // Mostrar animación de captura antes de cada intento
      if (swalContainer) {
        const textElement = swalContainer.querySelector('.scanner-text p') as HTMLElement;
        const fingerprintIcon = swalContainer.querySelector('.fingerprint-icon') as HTMLElement;
        const pulseRings = swalContainer.querySelectorAll('.pulse-ring, .pulse-ring-2');
        
        if (textElement) {
          textElement.innerHTML = '🔄 Capturando huella...';
          textElement.style.color = '#007bff';
        }
        
        if (fingerprintIcon) {
          fingerprintIcon.innerHTML = '🔄';
          fingerprintIcon.style.animation = 'spin 1s linear infinite';
        }
        
        // Acelerar pulsos durante captura
        pulseRings.forEach(ring => {
          const htmlRing = ring as HTMLElement;
          htmlRing.style.animationDuration = '1s';
          htmlRing.style.borderColor = '#007bff';
        });
      }
      
      const res = await identifyOnce();
      attempts++;
      
      console.log(`[ZKT Eco 9500] Intento ${attempts}/${maxAttempts}:`, res);
      
      // Actualizar la animación con el progreso
      if (swalContainer) {
        const textElement = swalContainer.querySelector('.scanner-text p') as HTMLElement;
        const iconElement = swalContainer.querySelector('.fingerprint-icon') as HTMLElement;
        if (textElement && iconElement) {
          textElement.innerHTML = `<span class="spinner">🔄</span> Verificando... Intento ${attempts}/${maxAttempts}`;
          textElement.style.color = '#ffc107';
          iconElement.innerHTML = '🔍'; // Cambiar a ícono de búsqueda
          iconElement.style.animation = 'spin 1s linear infinite';
        }
      }
      
      if (res.match && res.userId) { 
        console.log("✅ [ZKT Eco 9500] Usuario identificado!", res);
        
        // Mostrar animación de éxito
        if (swalContainer) {
          const textElement = swalContainer.querySelector('.scanner-text p') as HTMLElement;
          const fingerprintIcon = swalContainer.querySelector('.fingerprint-icon') as HTMLElement;
          const pulseRings = swalContainer.querySelectorAll('.pulse-ring, .pulse-ring-2');
          
          if (textElement) {
            textElement.innerHTML = '✅ ¡Huella Reconocida!';
            textElement.style.color = '#28a745';
            textElement.style.fontWeight = 'bold';
          }
          
          if (fingerprintIcon) {
            fingerprintIcon.innerHTML = '✅';
            fingerprintIcon.style.color = '#28a745';
          }
          
          // Cambiar anillos a verde
          pulseRings.forEach(ring => {
            const htmlRing = ring as HTMLElement;
            htmlRing.style.borderColor = '#28a745';
            htmlRing.style.animationDuration = '0.5s';
          });
        }
        
        // Feedback háptico y sonoro para éxito
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]); // Patrón de vibración de éxito
        }
        
        // Sonido de éxito (si está disponible)
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBziS2fPNeSsFJHfH8N2QQAoVXrPo66hVFApGnuD0v2EcBjiS2fLNeSsFJHfH8N2QQAoUXrPo66hVFApGnuD0v2EcBjiS2fLNeSsFJHfH8N2QQAoVXrPo66hVFApGnuD0v2EcBjiS2fLNeSsFJHfH8N2QQAoVXrPo66hVFApGnuD0v2EcBjiS2fLNeSsFJHfH8N2QQAoVXrPo66hVFApGnuD0v2EcBjiS2fLNeSsFJHfH8N2QQAoVXrPo66hVFApGnuD0v2EcBjiS2fLNeSsFJHfH8N2QQAoVXrPo66hVFApGnuD0v2EcBjiS2fLNeSsFJHfH8N2QQAoVXrPo66hVFApGnuD0v2EcBjiS2fLNeSsFJHfH8N2QQAoVXrPo66hVFA==');
          audio.volume = 0.3;
          audio.play().catch(() => {}); // Ignorar errores de audio
        } catch (e) {}
        
        // Esperar un poco para mostrar la animación de éxito
        await new Promise(r => setTimeout(r, 800));
        matched = res; 
        break; 
      }
      
      // Si hay un error real (no solo "no hay dedo"), salir del bucle
      if (!res.ok) {
        console.error("❌ [ZKT Eco 9500] Error en identificación:", res);
        break;
      }
      
      // Contar casos específicos de "no hay dedo"
      if (!res.match && !res.userId) {
        noFingerCount++;
        console.log(`⚠️ [ZKT Eco 9500] No hay dedo detectado (${noFingerCount}/${maxNoFingerAttempts})`);
        
        // Actualizar animación para "no hay dedo"
        if (swalContainer) {
          const textElement = swalContainer.querySelector('.scanner-text p') as HTMLElement;
          const fingerprintIcon = swalContainer.querySelector('.fingerprint-icon') as HTMLElement;
          
          if (textElement) {
            textElement.innerHTML = '⚠️ No hay dedo detectado';
            textElement.style.color = '#ffc107';
          }
          
          if (fingerprintIcon) {
            fingerprintIcon.innerHTML = '👆';
            fingerprintIcon.style.animation = 'shake 0.5s ease-in-out';
          }
        }
        
        if (noFingerCount >= maxNoFingerAttempts) {
          console.log("🚫 [ZKT Eco 9500] Demasiados intentos sin dedo, saliendo");
          
          // Animación de fallo
          if (swalContainer) {
            const textElement = swalContainer.querySelector('.scanner-text p') as HTMLElement;
            const fingerprintIcon = swalContainer.querySelector('.fingerprint-icon') as HTMLElement;
            const pulseRings = swalContainer.querySelectorAll('.pulse-ring, .pulse-ring-2');
            
            if (textElement) {
              textElement.innerHTML = '❌ Sin dedo detectado';
              textElement.style.color = '#dc3545';
            }
            
            if (fingerprintIcon) {
              fingerprintIcon.innerHTML = '❌';
              fingerprintIcon.style.color = '#dc3545';
            }
            
            pulseRings.forEach(ring => {
              const htmlRing = ring as HTMLElement;
              htmlRing.style.borderColor = '#dc3545';
            });
          }
          
          scanningRef.current = false;
          break;
        }
      }
      
      // Si detectamos "Sin coincidencias" después de 2 intentos
      if (!res.match && !res.userId && attempts >= 2) {
        console.log("🚫 [ZKT Eco 9500] Sin coincidencias después de 2 intentos, saliendo");
        
        // Animación para huella no reconocida
        if (swalContainer) {
          const textElement = swalContainer.querySelector('.scanner-text p') as HTMLElement;
          const fingerprintIcon = swalContainer.querySelector('.fingerprint-icon') as HTMLElement;
          const pulseRings = swalContainer.querySelectorAll('.pulse-ring, .pulse-ring-2');
          
          if (textElement) {
            textElement.innerHTML = '🚫 Huella no reconocida';
            textElement.style.color = '#dc3545';
            textElement.style.fontWeight = 'bold';
          }
          
          if (fingerprintIcon) {
            fingerprintIcon.innerHTML = '🚫';
            fingerprintIcon.style.color = '#dc3545';
            fingerprintIcon.style.animation = 'shake 0.6s ease-in-out 2';
          }
          
          pulseRings.forEach(ring => {
            const htmlRing = ring as HTMLElement;
            htmlRing.style.borderColor = '#dc3545';
            htmlRing.style.animationDuration = '0.3s';
          });
        }
        
        // Esperar un poco para mostrar la animación de error
        await new Promise(r => setTimeout(r, 1000));
        
        scanningRef.current = false;
        break;
      }
      
      // Salir después de 3 intentos sin coincidencias
      if (attempts >= 3 && !matched) {
        console.log("🚫 [ZKT Eco 9500] 3 intentos sin coincidencias, saliendo automáticamente");
        scanningRef.current = false; // Forzar salida
        break;
      }
      
      // Espera optimizada para ZKT Eco 9500 (un poco más de tiempo)
      await new Promise(r => setTimeout(r, 1200));
    }
    
    // Limpiar el timeout
    clearTimeout(timeoutId);
    
    // Si llegamos al máximo de intentos sin identificar
    if (attempts >= maxAttempts && !matched) {
      console.log("Máximo de intentos alcanzado, solicitando teléfono");
    }
    
    // Cerrar el diálogo de escaneo
    Swal.close();

    try {
      if (matched?.match && matched.userId) {
        console.log("Usuario identificado:", matched);
        const data = await register({ userId: matched.userId });
        console.log("Datos de registro:", data);
        vibrate(200);
        await showCard(data, matched.name);
      } else {
        console.log("No se identificó usuario, solicitando teléfono");
        const phone = await askPhone("No te reconocimos. Registra por teléfono");
        if (!phone) {
          console.log("Usuario canceló el ingreso de teléfono");
          return;
        }
        const data = await register({ phone });
        console.log("Datos de registro por teléfono:", data);
        vibrate(200);
        await showCard(data);
      }
    } catch (e: any) {
      console.error("Error en registro:", e);
      vibrate(60);
      await Swal.fire({ ...swalBase, icon: "error", title: "No se pudo registrar la asistencia", text: e?.message || "Inténtalo de nuevo." });
    } finally {
      console.log("Finalizando proceso de escaneo");
      setLoading(false);
      scanningRef.current = false;
      abortRef.current?.abort();
    }
  };

  const forceCheckout = async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setLoading(true);

    // Mostrar diálogo de escaneo con animación mejorada para salida
    Swal.fire({
      ...swalBase,
      title: "🔍 Verificando Huella para Salida",
      html: `
        <div class="fingerprint-scanner">
          <div class="scanner-animation">
            <div class="pulse-ring"></div>
            <div class="pulse-ring-2"></div>
            <div class="fingerprint-icon">👆</div>
          </div>
          <div class="scanner-text">
            <p style="margin: 15px 0 5px 0; font-size: 16px; color: #333;">Coloca tu dedo en el ZKT Eco 9500</p>
            <small style="opacity: 0.7; font-size: 13px;">Presiona firmemente y mantén quieto</small>
          </div>
        </div>
        <style>
          .fingerprint-scanner {
            text-align: center;
            padding: 10px;
          }
          .scanner-animation {
            position: relative;
            display: inline-block;
            margin: 10px 0 20px 0;
          }
          .pulse-ring, .pulse-ring-2 {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            border: 3px solid #dc3545;
            border-radius: 50%;
            animation: pulse 2s infinite;
          }
          .pulse-ring-2 {
            animation-delay: 1s;
            border-color: #ff6b6b;
          }
          .fingerprint-icon {
            font-size: 40px;
            z-index: 10;
            position: relative;
            animation: bounce 1.5s infinite;
          }
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(0.8);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(1.8);
              opacity: 0;
            }
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinner {
            display: inline-block;
            animation: spin 1s linear infinite;
            margin-right: 8px;
          }
          .fingerprint-popup {
            border-radius: 15px !important;
            box-shadow: 0 8px 25px rgba(220,53,69,0.15) !important;
          }
          .swal2-confirm-custom {
            background-color: #dc3545 !important;
            border-color: #dc3545 !important;
            font-weight: bold !important;
            border-radius: 25px !important;
            padding: 10px 20px !important;
          }
          .swal2-confirm-custom:hover {
            background-color: #c82333 !important;
            border-color: #bd2130 !important;
          }
        </style>
      `,
      allowOutsideClick: true,
      showConfirmButton: true,
      confirmButtonText: "🛑 Detener",
      showCancelButton: false,
      customClass: {
        popup: 'fingerprint-popup',
        confirmButton: 'swal2-confirm-custom'
      },
      didOpen: () => {
        // Configurar evento para el botón de detener
        const confirmButton = document.querySelector('.swal2-confirm');
        if (confirmButton) {
          confirmButton.addEventListener('click', () => {
            scanningRef.current = false;
            setLoading(false);
            Swal.close();
          });
        }
      },
    });

    let matched: IdentifyResult | null = null;
    let attempts = 0;
    const maxAttempts = 4;
    let noFingerCount = 0;
    const maxNoFingerAttempts = 3;
    
    // Timeout optimizado para ZKT Eco 9500
    const timeoutId = setTimeout(() => {
      console.log("[ZKT Eco 9500] Timeout alcanzado (8s), deteniendo escaneo de salida");
      scanningRef.current = false;
      Swal.close();
    }, 8000);
    
    while (scanningRef.current && attempts < maxAttempts) {
      if (!scanningRef.current) break;
      
      // Obtener referencia al contenedor una sola vez
      const swalContainer = document.querySelector('.fingerprint-scanner');
      
      // Mostrar animación de captura antes de cada intento
      if (swalContainer) {
        const textElement = swalContainer.querySelector('.scanner-text p') as HTMLElement;
        const fingerprintIcon = swalContainer.querySelector('.fingerprint-icon') as HTMLElement;
        const pulseRings = swalContainer.querySelectorAll('.pulse-ring, .pulse-ring-2');
        
        if (textElement) {
          textElement.innerHTML = '🔄 Capturando huella para salida...';
          textElement.style.color = '#dc3545';
        }
        
        if (fingerprintIcon) {
          fingerprintIcon.innerHTML = '🔄';
          fingerprintIcon.style.animation = 'spin 1s linear infinite';
        }
        
        // Acelerar pulsos durante captura
        pulseRings.forEach(ring => {
          const htmlRing = ring as HTMLElement;
          htmlRing.style.animationDuration = '1s';
          htmlRing.style.borderColor = '#dc3545';
        });
      }
      
      const res = await identifyOnce();
      attempts++;
      
      console.log(`[ZKT Eco 9500] Intento de salida ${attempts}/${maxAttempts}:`, res);
      
      // Actualizar la animación con el progreso
      if (swalContainer) {
        const textElement = swalContainer.querySelector('.scanner-text p') as HTMLElement;
        const iconElement = swalContainer.querySelector('.fingerprint-icon') as HTMLElement;
        if (textElement && iconElement) {
          textElement.innerHTML = `<span class="spinner">🔄</span> Verificando salida... Intento ${attempts}/${maxAttempts}`;
          textElement.style.color = '#ffc107';
          iconElement.innerHTML = '🔍';
          iconElement.style.animation = 'spin 1s linear infinite';
        }
      }
      
      if (res.match && res.userId) { 
        console.log("✅ [ZKT Eco 9500] Usuario identificado para salida!", res);
        
        // Mostrar animación de éxito
        if (swalContainer) {
          const textElement = swalContainer.querySelector('.scanner-text p') as HTMLElement;
          const fingerprintIcon = swalContainer.querySelector('.fingerprint-icon') as HTMLElement;
          const pulseRings = swalContainer.querySelectorAll('.pulse-ring, .pulse-ring-2');
          
          if (textElement) {
            textElement.innerHTML = '✅ ¡Huella Reconocida para Salida!';
            textElement.style.color = '#28a745';
            textElement.style.fontWeight = 'bold';
          }
          
          if (fingerprintIcon) {
            fingerprintIcon.innerHTML = '✅';
            fingerprintIcon.style.color = '#28a745';
          }
          
          // Cambiar anillos a verde
          pulseRings.forEach(ring => {
            const htmlRing = ring as HTMLElement;
            htmlRing.style.borderColor = '#28a745';
            htmlRing.style.animationDuration = '0.5s';
          });
        }
        
        // Feedback háptico y sonoro para éxito
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        
        // Esperar un poco para mostrar la animación de éxito
        await new Promise(r => setTimeout(r, 800));
        matched = res; 
        break; 
      }
      
      // Si hay un error real (no solo "no hay dedo"), salir del bucle
      if (!res.ok) {
        console.error("❌ [ZKT Eco 9500] Error en identificación de salida:", res);
        break;
      }
      
      // Contar casos específicos de "no hay dedo"
      if (!res.match && !res.userId) {
        noFingerCount++;
        console.log(`⚠️ [ZKT Eco 9500] No hay dedo detectado para salida (${noFingerCount}/${maxNoFingerAttempts})`);
        
        // Actualizar animación para "no hay dedo"
        if (swalContainer) {
          const textElement = swalContainer.querySelector('.scanner-text p') as HTMLElement;
          const fingerprintIcon = swalContainer.querySelector('.fingerprint-icon') as HTMLElement;
          
          if (textElement) {
            textElement.innerHTML = '⚠️ No hay dedo detectado';
            textElement.style.color = '#ffc107';
          }
          
          if (fingerprintIcon) {
            fingerprintIcon.innerHTML = '👆';
            fingerprintIcon.style.animation = 'shake 0.5s ease-in-out';
          }
        }
        
        if (noFingerCount >= maxNoFingerAttempts) {
          console.log("🚫 [ZKT Eco 9500] Demasiados intentos sin dedo para salida, saliendo");
          
          // Animación de fallo
          if (swalContainer) {
            const textElement = swalContainer.querySelector('.scanner-text p') as HTMLElement;
            const fingerprintIcon = swalContainer.querySelector('.fingerprint-icon') as HTMLElement;
            const pulseRings = swalContainer.querySelectorAll('.pulse-ring, .pulse-ring-2');
            
            if (textElement) {
              textElement.innerHTML = '❌ Sin dedo detectado';
              textElement.style.color = '#dc3545';
            }
            
            if (fingerprintIcon) {
              fingerprintIcon.innerHTML = '❌';
              fingerprintIcon.style.color = '#dc3545';
            }
            
            pulseRings.forEach(ring => {
              const htmlRing = ring as HTMLElement;
              htmlRing.style.borderColor = '#dc3545';
            });
          }
          
          scanningRef.current = false;
          break;
        }
      }
      
      // Si detectamos "Sin coincidencias" después de 2 intentos
      if (!res.match && !res.userId && attempts >= 2) {
        console.log("🚫 [ZKT Eco 9500] Sin coincidencias para salida después de 2 intentos, saliendo");
        
        // Animación para huella no reconocida
        if (swalContainer) {
          const textElement = swalContainer.querySelector('.scanner-text p') as HTMLElement;
          const fingerprintIcon = swalContainer.querySelector('.fingerprint-icon') as HTMLElement;
          const pulseRings = swalContainer.querySelectorAll('.pulse-ring, .pulse-ring-2');
          
          if (textElement) {
            textElement.innerHTML = '🚫 Huella no reconocida para salida';
            textElement.style.color = '#dc3545';
            textElement.style.fontWeight = 'bold';
          }
          
          if (fingerprintIcon) {
            fingerprintIcon.innerHTML = '🚫';
            fingerprintIcon.style.color = '#dc3545';
            fingerprintIcon.style.animation = 'shake 0.6s ease-in-out 2';
          }
          
          pulseRings.forEach(ring => {
            const htmlRing = ring as HTMLElement;
            htmlRing.style.borderColor = '#dc3545';
            htmlRing.style.animationDuration = '0.3s';
          });
        }
        
        // Esperar un poco para mostrar la animación de error
        await new Promise(r => setTimeout(r, 1000));
        
        scanningRef.current = false;
        break;
      }
      
      // Salir después de 3 intentos sin coincidencias
      if (attempts >= 3 && !matched) {
        console.log("🚫 [ZKT Eco 9500] 3 intentos sin coincidencias para salida, saliendo automáticamente");
        scanningRef.current = false;
        break;
      }
      
      // Espera optimizada para ZKT Eco 9500
      await new Promise(r => setTimeout(r, 1200));
    }
    
    // Limpiar el timeout
    clearTimeout(timeoutId);
    
    // Cerrar el diálogo de escaneo
    Swal.close();

    try {
      if (matched?.match && matched.userId) {
        console.log("Usuario identificado para salida:", matched);
        const data = await register({ userId: matched.userId, intent: "checkout" });
        console.log("Datos de registro de salida:", data);
        vibrate(200);
        await showCard(data, matched.name);
      } else {
        console.log("No se identificó usuario para salida, solicitando teléfono");
        const phone = await askPhone("No te reconocimos. Salida por teléfono");
        if (!phone) {
          console.log("Usuario canceló el ingreso de teléfono para salida");
          return;
        }
        const data = await register({ phone, intent: "checkout" });
        console.log("Datos de registro de salida por teléfono:", data);
        vibrate(200);
        await showCard(data);
      }
    } catch (e: any) {
      console.error("Error en registro de salida:", e);
      vibrate(60);
      await Swal.fire({ ...swalBase, icon: "error", title: "No se pudo registrar la salida", text: e?.message || "Inténtalo de nuevo." });
    } finally {
      console.log("Finalizando proceso de escaneo de salida");
      setLoading(false);
      scanningRef.current = false;
      abortRef.current?.abort();
    }
  };

  // ==================== Panel: escucha comandos ====================
  useEffect(() => {
    if (!mounted || mode !== "kiosk") return;
    const ev = new EventSource(`/api/commands?room=${encodeURIComponent(room)}`);
    ev.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data || "{}");
        if (data.action === "scan") startAutoScan();
        if (data.action === "checkout") forceCheckout();
        if (data.action === "stop") {
          scanningRef.current = false;
          abortRef.current?.abort();
          setLoading(false);
          Swal.close();
        }
      } catch {}
    };
    ev.onerror = () => {/* mantener abierta la conexión */};
    return () => ev.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, mode, room]);

  // ==================== remote: envía comandos ====================
  const sendCommand = async (action: "scan" | "checkout" | "stop") => {
    await fetch("/api/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, action }),
    }).catch(() => {});
  };

  // Función para agregar deuda
  const addDebt = async (productType: string, customAmount?: number, customName?: string) => {
    if (!selectedClient?.profileId) return;

    try {
      const response = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientProfileId: selectedClient.profileId,
          productType,
          quantity: 1,
          customAmount,
          customName,
        }),
      });

      if (response.ok) {
        await Swal.fire({
          ...swalBase,
          icon: "success",
          title: "Deuda agregada",
          timer: 1500,
          showConfirmButton: false,
        });
        setShowDebtDialog(false);
        setSelectedClient(null);
      } else {
        throw new Error("Error al agregar deuda");
      }
    } catch (error) {
      await Swal.fire({
        ...swalBase,
        icon: "error",
        title: "Error",
        text: "No se pudo agregar la deuda",
      });
    }
  };

  const isAdmin = session?.user?.role === "admin";

  // ==================== UI ====================
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full p-6 gap-4 border-b border-gray-800">
        <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">
          Panel de Asistencia {isAdmin && "(Admin)"}
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm opacity-80">
            Modo: <span className="px-2 py-0.5 rounded bg-yellow-400 text-black">{mode === "remote" ? "Control remoto" : "Panel"}</span> · Sala: <b>{room}</b>
          </div>
          <Link href="/admin/dashboard" className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 text-center">
            Dashboard
          </Link>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={`flex ${isAdmin ? "h-[calc(100vh-120px)]" : "flex-col items-center justify-center min-h-[calc(100vh-120px)]"} p-6 gap-6`}>
        
        {/* Columna izquierda - Controles */}
        <div className={`${isAdmin ? "w-1/2 border-r border-gray-800 pr-6" : "w-full max-w-2xl"} flex flex-col items-center justify-center gap-4`}>
          {mode === "kiosk" ? (
            <>
              <p className="text-gray-300 text-center max-w-2xl">
                Reconocimiento <b>automático por huella</b>. Si no te reconoce, usaremos tu <b>teléfono</b>.
              </p>

              {/* Botones principales */}
              <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                <button
                  onClick={startAutoScan}
                  className="bg-yellow-400 text-black px-6 py-4 rounded-lg font-bold text-lg hover:bg-yellow-500 disabled:opacity-60"
                  disabled={loading}
                >
                  🔎 Marcar Entrada
                </button>
                
                <button
                  onClick={forceCheckout}
                  className="bg-red-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-red-700 disabled:opacity-60"
                  disabled={loading}
                >
                  🚪 Marcar Salida
                </button>
                
                <button
                  onClick={() => {
                    scanningRef.current = false;
                    setLoading(false);
                    Swal.close();
                  }}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700"
                >
                  ✋ Detener
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      const phone = await askPhone("Ingresa tu teléfono para registrar asistencia");
                      if (!phone) return;
                      const data = await register({ phone });
                      vibrate(200);
                      await showCard(data);
                    } catch (e: any) {
                      console.error("Error en registro por teléfono:", e);
                      await Swal.fire({ ...swalBase, icon: "error", title: "Error", text: e?.message || "Inténtalo de nuevo." });
                    }
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  📱 Registrar por Teléfono
                </button>
                
              </div>

              {/* Generador de link para pantalla de visualización */}
              {isAdmin && (
                <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-yellow-400/30 w-full max-w-md">
                  <h3 className="text-yellow-400 font-semibold mb-2">📺 Pantalla de Visualización</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Link para mostrar las marcaciones en una pantalla adicional:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/check-in/display?room=${room}`}
                      readOnly
                      className="flex-1 bg-gray-800 text-white px-3 py-2 rounded text-sm"
                    />
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/check-in/display?room=${room}`;
                        navigator.clipboard.writeText(link);
                        alert("Link copiado al portapapeles");
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                    >
                      📋 Copiar
                    </button>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/check-in/display?room=${room}`;
                        window.open(link, '_blank');
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                    >
                      🔗 Abrir
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            // ====== Panel de control remoto ======
            <div className="w-full max-w-md grid grid-cols-1 gap-3">
              <button
                onClick={() => sendCommand("scan")}
                className="bg-yellow-400 text-black px-6 py-4 rounded-lg font-bold text-lg hover:bg-yellow-500"
              >
                🔎 Escanear / Marcar entrada
              </button>
              <button
                onClick={() => sendCommand("checkout")}
                className="bg-yellow-400 text-black px-6 py-4 rounded-lg font-bold text-lg hover:bg-yellow-500"
              >
                ⏏️ Marcar salida
              </button>
              <button
                onClick={() => sendCommand("stop")}
                className="bg-black border border-yellow-500 text-yellow-400 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600/30"
              >
                ✋ Detener
              </button>

              <p className="text-gray-400 text-xs mt-1">
                Abre <code>/check-in?room=nombre</code> en la PC/monitor (Panel) y <code>/check-in?remote=1&room=nombre</code> en el celular (control).
              </p>
            </div>
          )}
        </div>

        {/* Columna derecha - Stream de actividad (solo para admin) */}
        {isAdmin && (
          <div className="w-1/2 pl-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">Stream de Actividad</h2>
            <div className="bg-gray-900 rounded-lg p-4 h-[calc(100vh-220px)] overflow-y-auto">
              {activityLog.length === 0 ? (
                <p className="text-gray-500 text-center">No hay actividad reciente</p>
              ) : (
                <div className="space-y-3">
                  {activityLog.map((log) => (
                    <div key={log.id} className="bg-gray-800 rounded-lg p-3 border-l-4 border-yellow-400">
                      <div className="flex items-center gap-3">
                        <img
                          src={log.avatarUrl || `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(log.fullName)}`}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{log.fullName}</span>
                            <span className="text-xs text-gray-400">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              log.action === "checkin" 
                                ? "bg-green-600 text-white" 
                                : "bg-red-600 text-white"
                            }`}>
                              {log.action === "checkin" ? "Entrada" : "Salida"}
                            </span>
                            {log.daysLeft !== undefined && (
                              <span className="ml-2 text-gray-300">
                                {log.daysLeft} días restantes
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Deuda mensual: S/. {log.monthlyDebt.toFixed(2)} | 
                            Deuda diaria: S/. {log.dailyDebt.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Diálogo de deuda */}
      {showDebtDialog && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">
              Agregar Deuda - {selectedClient.fullName}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => addDebt("WATER_1_5")} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                Agua S/. 1.50
              </button>
              <button onClick={() => addDebt("WATER_2_5")} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                Agua S/. 2.50
              </button>
              <button onClick={() => addDebt("WATER_3_5")} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                Agua S/. 3.50
              </button>
              <button onClick={() => addDebt("PROTEIN_5")} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                Proteína S/. 5
              </button>
              <button onClick={() => addDebt("PRE_WORKOUT_3")} className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded">
                Pre S/. 3
              </button>
              <button onClick={() => addDebt("PRE_WORKOUT_5")} className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded">
                Pre S/. 5
              </button>
              <button onClick={() => addDebt("PRE_WORKOUT_10")} className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded">
                Pre S/. 10
              </button>
              <button 
                onClick={async () => {
                  const { value: customData } = await Swal.fire({
                    ...swalBase,
                    title: "Producto personalizado",
                    html: `
                      <input id="customName" class="swal2-input" placeholder="Nombre del producto">
                      <input id="customAmount" class="swal2-input" type="number" step="0.01" placeholder="Precio">
                    `,
                    focusConfirm: false,
                    preConfirm: () => {
                      const name = (document.getElementById('customName') as HTMLInputElement)?.value;
                      const amount = parseFloat((document.getElementById('customAmount') as HTMLInputElement)?.value || '0');
                      if (!name || amount <= 0) {
                        Swal.showValidationMessage('Ingresa nombre y precio válidos');
                        return false;
                      }
                      return { name, amount };
                    }
                  });
                  if (customData) {
                    addDebt("CUSTOM", customData.amount, customData.name);
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded col-span-2"
              >
                Producto personalizado
              </button>
            </div>
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setShowDebtDialog(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

