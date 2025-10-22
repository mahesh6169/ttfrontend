'use client';

import { QRCodeSVG } from 'react-qr-code';
import { useState } from 'react';

export default function QRCodeDisplay({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* QR Code */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <QRCodeSVG 
          value={code} 
          size={200}
          level="H"
        />
      </div>

      {/* Code Text */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-1">Your Code</p>
        <p className="text-2xl font-bold font-mono tracking-wider">
          {code}
        </p>
      </div>

      {/* Copy Button */}
      <button
        onClick={handleCopyCode}
        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
          copied
            ? 'bg-green-500 text-white'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {copied ? '✓ Copied!' : 'Copy Code'}
      </button>
    </div>
  );
}
