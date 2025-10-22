'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScanSuccess, onScanError }) {
  const scannerRef = useRef(null);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    // Initialize scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [0]  // 0 = camera only, no file upload
      },
      false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        // Successfully scanned
        onScanSuccess(decodedText);
      },
      (error) => {
        // Scan error (can be ignored, happens constantly while scanning)
        // Only report actual errors
        if (onScanError && !error.includes('NotFoundException')) {
          onScanError(error);
        }
      }
    );

    setScanner(html5QrcodeScanner);

    // Cleanup
    return () => {
      html5QrcodeScanner.clear().catch(err => {
        console.error('Error clearing scanner:', err);
      });
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div>
      {/* QR Scanner */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div id="qr-reader" ref={scannerRef}></div>
      </div>
    </div>
  );
}
