import {
  LayoutDashboard, Plus, Route, XCircle, Truck, BarChart3, Settings, Link2, Users,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useDelivery } from '@/contexts/DeliveryContext';

const navItems = [
  { title: 'Dashboard',        url: '/',                 icon: LayoutDashboard },
  { title: 'New Orders',       url: '/orders/new',       icon: Plus },
  { title: 'Routes & Dispatch',url: '/dispatch',         icon: Route },
  { title: 'Cancelled',        url: '/orders/cancelled', icon: XCircle },
];

const bottomItems = [
  { title: 'Customers',  url: '/customers',  icon: Users },
  { title: 'Couriers',   url: '/couriers',   icon: Truck },
  { title: 'Reports',    url: '/reports',    icon: BarChart3 },
  { title: 'Settings',   url: '/settings',   icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { orders } = useDelivery();
  const collapsed = state === 'collapsed';
  const isActive = (url: string) => {
    if (url === '/') return location.pathname === '/';
    return location.pathname.startsWith(url);
  };

  const newCount = orders.filter(o => o.status === 'New').length;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        {!collapsed ? (
          <div>
            <h1 className="text-[17px] font-bold text-primary leading-tight" style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.01em' }}>cleverence</h1>
            <p className="text-[9px] text-muted-foreground tracking-[0.18em] uppercase font-medium">Delivery Ops</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="text-primary font-bold text-base">C</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 flex flex-col">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    className={cn(
                      'cursor-pointer transition-colors relative',
                      isActive(item.url) && 'bg-primary/10 text-primary border-l-2 border-primary'
                    )}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <span className="flex-1">{item.title}</span>
                    )}
                    {!collapsed && item.url === '/orders/new' && newCount > 0 && (
                      <span className="ml-auto text-[10px] font-semibold bg-primary text-white rounded-full px-1.5 py-0.5 leading-none">
                        {newCount}
                      </span>
                    )}
                    {collapsed && item.url === '/orders/new' && newCount > 0 && (
                      <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                        {newCount}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isActive(item.url) && 'bg-primary/10 text-primary border-l-2 border-primary'
                    )}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        {!collapsed ? (
          <>
            <button className="w-full flex items-center justify-center gap-1.5 rounded-md border border-sidebar-border px-3 py-1.5 text-[11px] text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <Link2 className="h-3 w-3" />
              Connect to ERP/WMS
            </button>
            <p className="text-[10px] text-muted-foreground leading-tight mt-2">
              Version 24.1.19 &nbsp;·&nbsp; © 2026 Cleverence
            </p>
          </>
        ) : (
          <div className="flex justify-center">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
