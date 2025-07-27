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
        {/* Sidebar (Replaces LeftAd) */}
        <div className="w-[250px] lg:w-[200px]">
          <button
            className="md:hidden fixed top-15 left-0 z-50 p-2 bg-gray-100 rounded-md shadow"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
          </button>

          <div
            className={`fixed h-screen bg-white shadow-md z-40 transform ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
          >
           <AdminSidebar onLinkClick={handleLinkClick} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full mx-auto">{children}</div>
      </div>
    </ProtectedAdminRoute>
  );
};

export default AdminLayout;
