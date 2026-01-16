'use client';

import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IoMenu, IoClose } from 'react-icons/io5';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import '@/assets/styles/globals.css';




const AdminLayout = ({ children }) => {
  const router = useRouter();

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  

const handleLinkClick = () => {
  setSidebarOpen(false); // Close sidebar when a link is clicked
};


  return (
    <ProtectedAdminRoute>
      <div className="flex">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden fixed top-16 left-2 z-50 p-2 bg-white rounded-md shadow-md"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
        </button>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed md:sticky top-0 h-screen w-[250px] md:w-[200px] bg-white shadow-md z-40 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out md:translate-x-0`}
        >
          <AdminSidebar onLinkClick={handleLinkClick} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </ProtectedAdminRoute>
  );
};

export default AdminLayout;
