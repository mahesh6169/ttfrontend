import React from "react";

const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null; // Don't render if not open

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">{title || "Confirm Action"}</h2>
        <p>{message || "Are you sure you want to proceed?"}</p>
        <div className="mt-4 flex justify-end">
          <button onClick={onCancel} className="mr-2 p-2 border rounded">
            Cancel
          </button>
          <button onClick={onConfirm} className="bg-red-500 text-white p-2 rounded">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
