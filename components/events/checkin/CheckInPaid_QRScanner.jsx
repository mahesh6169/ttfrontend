'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft } from 'react-icons/fa';
import { MdCheckCircle, MdErrorOutline } from 'react-icons/md';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useDispatch, useSelector } from 'react-redux';
import { checkInByQR, updateLocalQRCheckIn } from '@/store/slices/events/checkInPaidSlice';
import { toast } from 'react-toastify';

const CheckInPaid_QRScanner = ({ onClose }) => {
  const dispatch = useDispatch();
  const { selectedEvent, actionLoading } = useSelector((state) => state.checkInPaid);
  
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedTicket, setLastScannedTicket] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualTicketNumber, setManualTicketNumber] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [errorData, setErrorData] = useState(null);
  const [autoCloseTimer, setAutoCloseTimer] = useState(null);
  
  const scannerRef = useRef(null);
  const qrReaderRef = useRef(null);
  const audioRef = useRef(null);
  const initializedRef = useRef(false);
  const observerRef = useRef(null);
  const idleTimerRef = useRef(null);

  // Idle auto-off: after 60s of no scans, close the scanner (camera off, back to the list). Reset on
  // every scan. Camera/scan/atomic logic is unchanged - this is only an inactivity timer.
  const IDLE_MS = 60000;
  const armIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => { if (onClose) onClose(); }, IDLE_MS);
  };

  // Arm the idle timer in its OWN effect - NOT the guarded init effect below, which early-returns on
  // React StrictMode's second mount (dev), leaving the timer cleared and never re-armed. This effect
  // runs on every mount, so the countdown is always live.
  useEffect(() => {
    armIdleTimer();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop any live camera tracks so the device is released IMMEDIATELY. html5-qrcode's clear() is async
  // and can leave the camera held, which causes "NotReadableError: Could not start video source" on the
  // next open or after a screen lock (the OS/browser needs the previous stream fully released first).
  const stopCameraTracks = () => {
    try {
      const video = qrReaderRef.current?.querySelector('video');
      const stream = video && video.srcObject;
      if (stream && typeof stream.getTracks === 'function') {
        stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) { /* noop */ } });
      }
    } catch (e) { /* best effort */ }
  };

  // Holds the scanner-build function so the visibility handler can re-acquire the camera after unlock.
  const buildRef = useRef(null);

  useEffect(() => {
    if (!qrReaderRef.current || initializedRef.current) return;

    initializedRef.current = true;

    if (audioRef.current === null) {
      audioRef.current = new Audio();
      audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLSfzMGHm7A7+OZRQ0PVKno8LJgGwc2j9r00n4zBSqCzvLSgDQGHW/C7+OZRQ0PVKno8LJhGgc3j9v00n4zBSqCzvLSgDMGHnDD7+OZRQ0PVKno8LJgGwc2j9r00n4zBSqCzvLSgDMGHnDD7+OZRQ0PVKno8LJhGgc3j9v00n4zBSqCzvLSgDQGHW/C7+OaRQ0PVKno8LJgGwc2j9r00n4zBSqCzvLSgDMGHnDD7+OZRQ0PVKno8LJhGgc3j9v00n4zBSqCzvLSgDQGHW/C7+OaRQ0PVKno8LJgGwc2j9r00n4zBSqCzvLSgDMGHnDD7+OZRQ0PVKno8LJhGgc3j9v00n4zBSqCzvLSgDQGHW/C7+OaRQ0PVKno8LJgGwc2j9r00n4zBSqCzvLSgDMGHnDD7+OZRQ0PVKno8LJhGgc3j9v00n4zBSqCzvLSgDQGHW/C7+OaRQ0PVKno8LJgGwc2j9r00n4zBSqCzvLSgDMGHnDD7+OZRQ0PVKno8LJhGgc3j9v00n4zBSqCzvLSgDQGHW/C7+OaRQ0PVKno8LJgGwc2j9r00n4zBSqCzvLSgDMGHnDD7+OZRQ0PVKno8LJhGgc3j9v00n4zBSqCzvLSgDQGHW/C7+OaRQ0PVKno8LJgGwc2j9r00n4zBSqCzvLSgDMGHnDD7+OZRQ0PVKno8LJhGgc3j9v00n4zBSqCzvLSgDQGHW/C7+OaRQ0PVKno8LJgGwc2j9r00n4zBSqCzvLSgDMGHnDD7+OZRQ0PVKno8LJhGgc3j9v00n4zBSqCzvLSgDQGHW/C7+OaRQ0PVKno8A==';
    }

    const initScanner = () => {
      if (scannerRef.current) return; // already running - don't double-acquire the camera
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [0],
          useBarCodeDetectorIfSupported: true,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          formatsToSupport: [0],
          videoConstraints: {
            facingMode: "environment"
          }
        },
        false
      );
      
      scanner.render(onScanSuccess, onScanError);
      scannerRef.current = scanner;

      if (!document.getElementById('qr-reader-style')) {
      const style = document.createElement('style');
      style.id = 'qr-reader-style';
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
          background: #1f2937 !important;
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
          color: white !important;
        }
        
        #qr-reader__header_message {
          font-size: 14px !important;
          color: #9ca3af !important;
          padding: 8px !important;
        }
      `;
      document.head.appendChild(style);
      }

      // The library labels its permission button "Request Camera Permissions".
      // Relabel it (and keep it relabelled if the library re-renders the button).
      const relabelPermissionButton = () => {
        const root = qrReaderRef.current;
        if (!root) return;
        const btn =
          root.querySelector('#html5-qrcode-button-camera-permission') ||
          Array.from(root.querySelectorAll('button')).find((b) =>
            /request camera permissions/i.test(b.textContent)
          );
        if (btn && btn.textContent.trim() !== 'Allow Access To Camera') {
          btn.textContent = 'Allow Access To Camera';
        }
      };
      relabelPermissionButton();
      observerRef.current = new MutationObserver(relabelPermissionButton);
      if (qrReaderRef.current) {
        observerRef.current.observe(qrReaderRef.current, { childList: true, subtree: true });
      }
    };

    // Expose the builder so the visibility handler can re-acquire the camera after an unlock.
    buildRef.current = () => { initializedRef.current = true; initScanner(); };
    const startTimer = setTimeout(initScanner, 100);

    return () => {
      clearTimeout(startTimer);
      if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
      if (scannerRef.current) {
        try { scannerRef.current.clear(); } catch (e) { /* noop */ }
        scannerRef.current = null;
      }
      stopCameraTracks();            // release the device NOW so the next open (e.g. after auto-close) is clean
      initializedRef.current = false;
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }, []);

  // Screen lock / app background kills the camera stream; the browser keeps the device "held", so the
  // next start throws NotReadableError and html5-qrcode falls back to its "Allow access" button. Fix:
  // release the camera when the page is hidden, and re-acquire a FRESH stream when it returns (after a
  // short delay so the OS can free the device). This also covers the auto-close-then-reopen case.
  useEffect(() => {
    const releaseCamera = () => {
      if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
      if (scannerRef.current) { try { scannerRef.current.clear(); } catch (e) { /* noop */ } scannerRef.current = null; }
      stopCameraTracks();
      initializedRef.current = false;
    };
    const onVisibility = () => {
      if (document.hidden) {
        releaseCamera();
      } else {
        setTimeout(() => {
          if (!document.hidden && !scannerRef.current && buildRef.current) buildRef.current();
        }, 500);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScanSuccess = async (decodedText) => {
    armIdleTimer(); // a scan is activity - restart the idle countdown
    // Prevent duplicate scans while processing
    if (isScanning) {
      return;
    }

    setIsScanning(true);
    setLastScannedTicket(decodedText);
    
    // Pause scanner immediately to prevent duplicate scans
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause(true);
      } catch (err) {
        // Scanner pause failed, continue anyway
      }
    }
    
    await handleCheckIn(decodedText);
  };

  const onScanError = (error) => {
    if (!error.includes("NotFoundException") && !error.includes("No barcode or QR code detected")) {
      console.error("QR Scan Error:", error);
    }
  };

  const handleCheckIn = async (ticketNumber) => {
    if (!selectedEvent) {
      toast.error('No event selected');
      setIsScanning(false);
      return;
    }

    const result = await dispatch(checkInByQR({
      eventId: selectedEvent._id,
      ticketNumber: ticketNumber.trim().toUpperCase()
    }));

    if (result.type.endsWith('/fulfilled')) {
      const ticketData = result.payload.ticket || result.payload;
      
      playSuccessSound();
      triggerVibration();
      
      dispatch(updateLocalQRCheckIn({
        ticketNumber: ticketData.ticketNumber,
        checkInTime: ticketData.checkInTime
      }));

      // The success modal (buyer + ticket + "Scan next") is the confirmation - no success toast on
      // top of it (toasts are kept for errors only, e.g. empty ticket number / no event).
      setSuccessData(ticketData);

      const timer = setTimeout(() => {
        resetScanner();
      }, 6000);
      setAutoCloseTimer(timer);
    } else {
      handleError(result.payload);
      const errorTimer = setTimeout(() => {
        resetScanner();
      }, 6000);
      setAutoCloseTimer(errorTimer);
    }
  };

  const handleError = (error) => {
    const errorCode = error?.errorCode || 'SERVER_ERROR';
    
    let errorTitle = '';
    let errorMessage = '';
    
    switch (errorCode) {
      case 'ALREADY_CHECKED_IN':
        errorTitle = 'Already Checked In';
        errorMessage = `${error.buyerName || 'This ticket'} is already checked in`;
        break;
      case 'WRONG_EVENT':
        errorTitle = 'Wrong Event';
        errorMessage = `This ticket is for "${error.eventTitle || 'another event'}"`;
        break;
      case 'TICKET_CANCELLED':
        errorTitle = 'Ticket Cancelled';
        errorMessage = `Ticket for ${error.buyerName || 'this attendee'} has been cancelled`;
        break;
      case 'TICKET_NOT_FOUND':
        errorTitle = 'Ticket Not Found';
        errorMessage = 'This ticket number does not exist';
        break;
      case 'CONCURRENT_CHECKIN':
        errorTitle = 'Already Checked In';
        errorMessage = 'This ticket was just checked in on another device';
        break;
      case 'NOT_AUTHORIZED':
        errorTitle = 'Not Authorized';
        errorMessage = 'You are not authorized to check in for this event';
        break;
      default:
        errorTitle = 'Check-In Failed';
        errorMessage = error?.message || 'Something went wrong';
    }
    
    setErrorData({ title: errorTitle, message: errorMessage, ticketNumber: error.ticketNumber });
  };

  const playSuccessSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  const triggerVibration = () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  const resetScanner = () => {
    setIsScanning(false);
    setSuccessData(null);
    setErrorData(null);
    setLastScannedTicket(null);
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
    
    // Resume scanner for next ticket
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch (err) {
        // Scanner resume failed, will need to restart manually
      }
    }
  };

  const handleManualCheckIn = async () => {
    if (!manualTicketNumber.trim()) {
      toast.error('Please enter a ticket number');
      return;
    }
    
    await handleCheckIn(manualTicketNumber);
    setManualTicketNumber('');
    setShowManualInput(false);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex-shrink-0 bg-slate-900 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-semibold px-2 py-1 -ml-2"
          >
            <FaChevronLeft className="text-sm" />
            Back
          </button>
          <h2 className="text-white text-lg font-semibold">Scan QR Code</h2>
          <div className="w-14"></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div id="qr-reader" ref={qrReaderRef} className="w-full max-w-md"></div>
        
        <div className="text-white text-center mt-4 space-y-2">
          <p className="text-sm">Point camera at ticket QR code</p>
          <p className="text-xs text-slate-400">Auto-scans on detect</p>
        </div>

        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="mt-6 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors text-sm"
        >
          🎫 Can't scan? Type ticket number
        </button>

        {showManualInput && (
          <div className="mt-4 w-full max-w-md bg-slate-800 rounded-lg p-4">
            <h3 className="text-white text-sm font-medium mb-3">Enter Ticket Number</h3>
            <input
              type="text"
              value={manualTicketNumber}
              onChange={(e) => setManualTicketNumber(e.target.value.toUpperCase())}
              placeholder="TKT-XXXXX-0001"
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-teal-500 text-sm mb-3"
              onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleManualCheckIn}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 text-sm"
              >
                {actionLoading ? 'Checking...' : 'Check In'}
              </button>
              <button
                onClick={() => {
                  setShowManualInput(false);
                  setManualTicketNumber('');
                }}
                className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 bg-slate-900 border-t border-slate-700 p-4">
        <div className="text-center text-sm text-slate-400">
          {selectedEvent && (
            <>
              <div className="font-medium text-white">{selectedEvent.title}</div>
              <div className="text-xs mt-1">Ready to scan</div>
            </>
          )}
        </div>
      </div>

      {successData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-xs text-center">
            <MdCheckCircle className="mx-auto w-11 h-11 text-teal-600" />
            <h3 className="mt-2 text-base font-semibold text-slate-900">Checked in</h3>
            <div className="mt-1 space-y-0.5">
              <p className="text-sm font-semibold text-slate-700 break-words">{String(successData.buyerName || '')}</p>
              {successData.ticketNumber && <p className="text-xs font-mono text-slate-500">{String(successData.ticketNumber)}</p>}
              {successData.ticketType && <p className="text-xs text-slate-500">{String(successData.ticketType)}</p>}
              {successData.seats && Array.isArray(successData.seats) && successData.seats.length > 0 && successData.seats[0] && (
                <p className="text-xs text-slate-500">Seat {String(successData.seats[0].row)}-{String(successData.seats[0].seatNumber)}</p>
              )}
            </div>
            <button
              onClick={resetScanner}
              className="mt-4 inline-flex items-center justify-center bg-teal-700 text-white hover:bg-teal-800 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              Scan next
            </button>
          </div>
        </div>
      )}

      {errorData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-xs text-center">
            <MdErrorOutline className="mx-auto w-11 h-11 text-red-500" />
            <h3 className="mt-2 text-base font-semibold text-red-600">{errorData.title}</h3>
            <div className="mt-1 space-y-1">
              <p className="text-sm text-slate-600">{errorData.message}</p>
              {errorData.ticketNumber && (
                <p className="text-xs font-mono text-slate-500">{String(errorData.ticketNumber)}</p>
              )}
            </div>
            <button
              onClick={resetScanner}
              className="mt-4 inline-flex items-center justify-center bg-teal-700 text-white hover:bg-teal-800 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              Scan next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInPaid_QRScanner;
