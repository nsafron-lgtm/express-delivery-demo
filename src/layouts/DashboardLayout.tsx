import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { MobileEmulator } from '@/components/MobileEmulator';
import { User, Smartphone, Moon, Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Welcome to Cleverence — Your delivery overview' },
  '/map': { title: 'Map', subtitle: 'Visualize deliveries on the map' },
  '/inventory/items': { title: 'Items Catalog', subtitle: 'Manage items and view inventory details' },
  '/orders/all': { title: 'Orders', subtitle: 'Manage all delivery orders' },
  '/orders/new': { title: 'New Orders', subtitle: 'Orders awaiting assignment' },
  '/orders/in-transit': { title: 'In Transit', subtitle: 'Orders currently on the way' },
  '/orders/delivered': { title: 'Delivered', subtitle: 'Successfully completed orders' },
  '/orders/cancelled': { title: 'Cancelled', subtitle: 'Cancelled delivery orders' },
  '/orders/assign': { title: 'Assign Orders', subtitle: 'Assign unassigned orders to couriers' },
  '/dispatch': { title: 'Dispatch & Routes', subtitle: 'Plan delivery runs and optimize routes' },
  '/orders/create': { title: 'Create Order', subtitle: 'Create a new delivery order' },
  '/customers': { title: 'Customers', subtitle: 'Manage customer records' },
  '/couriers': { title: 'Couriers', subtitle: 'Manage courier profiles and activity' },
  '/reports': { title: 'Reports', subtitle: 'View analytics and performance reports' },
  '/settings': { title: 'Settings', subtitle: 'Configure your workspace' },
};

export default function DashboardLayout() {
  const [showMobile, setShowMobile] = useState(true);
  const location = useLocation();
  const page = pageTitles[location.pathname] ?? { title: 'Cleverence', subtitle: 'Delivery Ops' };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-5 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1" />
              <div>
                <h1 className="text-[15px] font-semibold text-foreground leading-tight">{page.title}</h1>
                <p className="text-[11px] text-muted-foreground leading-tight">{page.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                <Moon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobile(!showMobile)}
                className={`h-8 w-8 ${showMobile ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                title="Toggle mobile emulator"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center ml-1">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
          </header>
          <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 overflow-auto p-6">
              <Outlet />
            </main>
            {showMobile && (
              <aside className="w-[340px] border-l border-border bg-card flex items-center justify-center p-4 shrink-0 overflow-auto">
                <MobileEmulator />
              </aside>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
