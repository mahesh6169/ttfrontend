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
        supportedScanTypes: [0],  // 0 = camera only, no file upload
        showTorchButtonIfSupported: true,
        useBarCodeDetectorIfSupported: true,
        rememberLastUsedCamera: true,
        formatsToSupport: [0]  // QR_CODE only
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

    // Add custom styles to improve button visibility
    const style = document.createElement('style');
    style.innerHTML = `
      #qr-reader {
        border: none !important;
      }
      
      #qr-reader__dashboard_section_csr button {
        background: #0d9488 !important;
        color: white !important;
        border: none !important;
        padding: 12px 24px !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 16px !important;
        cursor: pointer !important;
        margin: 8px 4px !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        transition: all 0.2s !important;
      }
      
      #qr-reader__dashboard_section_csr button:hover {
        background: #0f766e !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.15) !important;
      }
      
      #qr-reader__dashboard_section_csr select {
        width: 100% !important;
        padding: 12px !important;
        border: 2px solid #d1d5db !important;
        border-radius: 8px !important;
        font-size: 16px !important;
        background: white !important;
        color: #1f2937 !important;
        margin: 8px 0 !important;
        cursor: pointer !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
      }
      
      #qr-reader__dashboard_section_csr select:focus {
        outline: none !important;
        border-color: #0d9488 !important;
        box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1) !important;
      }
      
      #qr-reader__camera_selection {
        background: #f9fafb !important;
        padding: 16px !important;
        border-radius: 8px !important;
        margin-bottom: 16px !important;
      }
      
      #qr-reader__scan_region {
        border: 2px solid #0d9488 !important;
        border-radius: 8px !important;
      }
      
      #qr-reader__status_span {
        padding: 8px 16px !important;
        border-radius: 6px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
      }
      
      #qr-reader__header_message {
        font-size: 14px !important;
        color: #6b7280 !important;
        padding: 8px !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      html5QrcodeScanner.clear().catch(err => {
        console.error('Error clearing scanner:', err);
      });
      document.head.removeChild(style);
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
