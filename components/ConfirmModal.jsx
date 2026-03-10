import React from "react";

const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, isLoading = false, confirmText = "Confirm", cancelText = "Cancel" }) => {
  if (!isOpen) return null; // Don't render if not open

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl">
        <div className="p-4">
          <h2 className="text-base font-semibold text-slate-900">{title || "Confirm Action"}</h2>
          <p className="text-sm text-slate-600 mt-1">{message || "Are you sure you want to proceed?"}</p>
        </div>
        <div className="flex border-t border-slate-200">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`flex-1 py-3 text-sm font-medium text-slate-700 active:bg-slate-100 ${isLoading ? 'opacity-50' : ''} ${confirmText ? 'border-r border-slate-200' : ''}`}
          >
            {cancelText}
          </button>
          {confirmText && (
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 text-sm font-medium text-red-600 active:bg-red-50 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading && (
                <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              )}
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
