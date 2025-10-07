import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ProconSidebar } from './ProconSidebar';
import { Header } from './Header';

export function ProconLayout() {
  return (
    <SidebarProvider>
      <ProconSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

