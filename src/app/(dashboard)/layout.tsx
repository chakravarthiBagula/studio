import React from 'react';

interface DashboardLayoutProps {
import { SidebarNav } from '@/components/layout/SidebarNav'; // Import SidebarNav
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen"> {/* Flex container for layout */}
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-100 p-4 border-r"> {/* Fixed width sidebar with background and padding, add border */}
        <SidebarNav /> {/* Render the SidebarNav component */}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4"> {/* Takes remaining width, adds scrollbar if needed, and padding */}
        {children} {/* Renders the child components */}
      </main>
    </div>
  );
};

export default DashboardLayout;