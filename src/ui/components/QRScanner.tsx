"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef } from "react";

interface QRScannerProps {
  onScan: (data: string) => void;
}

const QRScannerComponent: React.FC<QRScannerProps> = ({ onScan }) => {
  const scannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear(); // Detener el escáner después de una lectura
      },
      (errorMessage) => {
        console.log("Error escaneando:", errorMessage);
      }
    );

    return () => {
      scanner.clear();
    };
  }, [onScan]);

  return <div id="qr-reader" ref={scannerRef} className="w-full max-w-md" />;
};

export default QRScannerComponent;
