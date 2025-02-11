"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

interface QRScannerProps {
  onScan: (data: string) => void;
}

const QRScannerComponent: React.FC<QRScannerProps> = ({ onScan }) => {
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!scannerRef.current || scanner) return;

    const qrScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    qrScanner.render(
      (decodedText) => {
        onScan(decodedText);
        qrScanner.clear().catch((err) => console.error("Error limpiando escáner:", err));
        setScanner(null);
      },
      (errorMessage) => {
        console.log("Error escaneando:", errorMessage);
      }
    );

    setScanner(qrScanner);

    return () => {
      qrScanner.clear().catch((err) => console.error("Error limpiando escáner al desmontar:", err));
      setScanner(null);
    };
  }, [onScan, scanner]);

  return <div id="qr-reader" ref={scannerRef} className="w-full max-w-md" />;
};

export default QRScannerComponent;
