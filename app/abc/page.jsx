import React from 'react';

const Layout = () => {
  return (
    <div className="bg-gray-100">
      <div className="container mx-auto p-4">
        <header className="bg-gray-200 p-4 mb-4 text-center">Header</header>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Left Side Banner Ad */}
          <aside className="bg-yellow-200 p-4 hidden md:block md:sticky md:top-4">
            Side Banner Ad (Left)
          </aside>

          {/* Main Content and Banner Ads */}
          <div className="md:col-span-3">
            <div className="bg-blue-200 p-4 mb-4 text-center">Banner Ad (Top)</div>
            <main className="bg-white p-4 mb-4">Content</main>
            <div className="bg-blue-200 p-4 text-center">Banner Ad (Bottom)</div>
          </div>

          {/* Right Side Banner Ad */}
          <aside className="bg-yellow-200 p-4 hidden md:block md:sticky md:top-4">
            Side Banner Ad (Right)
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Layout;