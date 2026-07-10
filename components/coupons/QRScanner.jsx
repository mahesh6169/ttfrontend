'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = forwardRef(function QRScanner({ onScanSuccess, onScanError }, ref) {
  const readerRef = useRef(null);
  const instanceRef = useRef(null);
  // Keep the latest callbacks in refs so parent re-renders never tear down the camera
  const successRef = useRef(onScanSuccess);
  const errorRef = useRef(onScanError);
  successRef.current = onScanSuccess;
  errorRef.current = onScanError;

  // Let the parent pause/resume the camera without remounting it
  useImperativeHandle(ref, () => ({
    pause: () => { try { instanceRef.current?.pause(true); } catch (e) { /* noop */ } },
    resume: () => { try { instanceRef.current?.resume(); } catch (e) { /* noop */ } },
  }), []);

  useEffect(() => {
    if (!readerRef.current) return;

    let scanner = null;
    let styleEl = null;

    // Defer init one tick so React 18 StrictMode's mount → cleanup → mount
    // double-invoke can't create two scanner widgets in #qr-reader (the async
    // clear() from the first mount doesn't finish before the second render()).
    const initTimer = setTimeout(() => {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [0],  // 0 = camera only, no file upload
          useBarCodeDetectorIfSupported: true,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,          // flashlight toggle for dim shops
          videoConstraints: { facingMode: 'environment' },  // prefer the rear camera
          formatsToSupport: [0]  // QR_CODE only
        },
        false
      );

      scanner.render(
        (decodedText) => {
          successRef.current?.(decodedText);
        },
        (error) => {
          if (errorRef.current && !error.includes('NotFoundException')) {
            errorRef.current(error);
          }
        }
      );

      instanceRef.current = scanner;

      // Custom styles for the html5-qrcode widget (on-palette: teal + slate)
      styleEl = document.createElement('style');
      styleEl.innerHTML = `
      #qr-reader {
        border: none !important;
      }

      #qr-reader__dashboard_section_csr button {
        background: #0f766e !important;
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
        background: #115e59 !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.15) !important;
      }

      #qr-reader__dashboard_section_csr select {
        width: 100% !important;
        padding: 12px !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 8px !important;
        font-size: 16px !important;
        background: white !important;
        color: #0f172a !important;
        margin: 8px 0 !important;
        cursor: pointer !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
      }

      #qr-reader__dashboard_section_csr select:focus {
        outline: none !important;
        border-color: #0d9488 !important;
        box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15) !important;
      }

      #qr-reader__camera_selection {
        background: #f8fafc !important;
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
        color: #64748b !important;
        padding: 8px !important;
      }
      `;
      document.head.appendChild(styleEl);
    }, 0);

    // Cleanup
    return () => {
      clearTimeout(initTimer);
      if (scanner) {
        scanner.clear().catch(err => {
          console.error('Error clearing scanner:', err);
        });
      }
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
      instanceRef.current = null;
    };
  }, []);

  return (
    <div>
      {/* QR Scanner */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div id="qr-reader" ref={readerRef}></div>
      </div>
    </div>
  );
});

export default QRScanner;
