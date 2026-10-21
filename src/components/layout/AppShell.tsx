import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DemoBanner } from './DemoBanner';
import { ToastContainer } from '../common/ToastContainer';

export const AppShell: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col font-sans text-slate-100">
      {/* Top Demo Notification Banner */}
      <DemoBanner />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
          <Header onMenuToggle={() => setMobileOpen(!mobileOpen)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
