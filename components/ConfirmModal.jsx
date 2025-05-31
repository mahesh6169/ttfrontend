import React from "react";

const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, isLoading = false, confirmText = "Confirm", cancelText = "Cancel" }) => {
  if (!isOpen) return null; // Don't render if not open

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">{title || "Confirm Action"}</h2>
        <p>{message || "Are you sure you want to proceed?"}</p>
<div className="mt-4 flex justify-end">
  <button 
    onClick={onCancel} 
    disabled={isLoading}
    className={`mr-2 p-2 border rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {cancelText}
  </button>
  <button 
    onClick={onConfirm} 
    disabled={isLoading}
    className={`bg-red-500 text-white p-2 rounded flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
  >
    {isLoading && (
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    )}
    {confirmText}
  </button>
</div>
      </div>
    </div>
  );
};

export default ConfirmModal;
