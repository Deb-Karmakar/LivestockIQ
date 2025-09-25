import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from '@/components/Navigation'; // Adjust import path if needed

const PublicLayout = () => {
  return (
    <div>
      <Navigation />
      <main>
        {/* Child routes (like LandingPage and LearnMore) will be rendered here */}
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;