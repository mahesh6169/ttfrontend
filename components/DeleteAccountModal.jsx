import React from 'react';

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Delete Account
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            Are you sure you want to delete your account?
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800 font-medium mb-2">
              This action will permanently delete:
            </p>
            <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
              <li>Your profile and account details</li>
              <li>All your listed adverts</li>
              <li>All your listed events</li>
              <li>All your listed threads</li>
              <li>All your messages and conversations</li>
              <li>Your wishlist items</li>
            </ul>
            <p className="text-sm text-red-800 font-medium mt-3">
              This action cannot be undone.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;