import React from 'react';
import { Outlet } from 'react-router-dom';
// You will create these components next
// import Sidebar from './Sidebar'; 
// import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* <Sidebar /> */}
      <div className="flex flex-col flex-1">
        {/* <Navbar /> */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet /> {/* Child pages will be rendered here */}
        </main>
      </div>
    </div>
  );
};

export default Layout;