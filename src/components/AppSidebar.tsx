import {
  LayoutDashboard, Map, Package, ShoppingCart, Users, Truck, BarChart3, Settings,
  ChevronDown, Plus, Send, CheckCircle, XCircle, ClipboardList, Link2, Route,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const mainNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Map', url: '/map', icon: Map },
];

const inventoryNav = [
  { title: 'Items', url: '/inventory/items', icon: Package },
];

const ordersNav = [
  { title: 'All Orders', url: '/orders/all', icon: ClipboardList },
  { title: 'New Orders', url: '/orders/new', icon: Plus },
  { title: 'In Transit', url: '/orders/in-transit', icon: Send },
  { title: 'Delivered', url: '/orders/delivered', icon: CheckCircle },
  { title: 'Cancelled', url: '/orders/cancelled', icon: XCircle },
  { title: 'Dispatch & Routes', url: '/dispatch', icon: Route },
  { title: 'Assign Orders', url: '/orders/assign', icon: Users },
];

const bottomNav = [
  { title: 'Customers', url: '/customers', icon: Users },
  { title: 'Couriers', url: '/couriers', icon: Truck },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Settings', url: '/settings', icon: Settings },
];

function NavItem({ item, isActive }: { item: { title: string; url: string; icon: React.ElementType }; isActive: boolean }) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => navigate(item.url)}
        className={cn(
          'cursor-pointer transition-colors',
          isActive && 'bg-primary/20 text-primary border-l-2 border-primary'
        )}
        tooltip={item.title}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.title}</span>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const isActive = (path: string) => location.pathname === path;
  const isOrdersActive = location.pathname.startsWith('/orders');
  const isInventoryActive = location.pathname.startsWith('/inventory');

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-[17px] font-bold text-primary leading-tight" style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.01em' }}>cleverence</h1>
              <p className="text-[9px] text-muted-foreground tracking-[0.18em] uppercase font-medium">Delivery Ops</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="text-primary font-bold text-base">C</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(item => (
                <NavItem key={item.url} item={item} isActive={isActive(item.url)} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Inventory */}
        <SidebarGroup>
          <Collapsible defaultOpen={isInventoryActive}>
            <CollapsibleTrigger className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              {!collapsed && (
                <>
                  <span className="uppercase tracking-wider">Inventory</span>
                  <ChevronDown className="ml-auto h-3 w-3" />
                </>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {inventoryNav.map(item => (
                    <NavItem key={item.url} item={item} isActive={isActive(item.url)} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Orders */}
        <SidebarGroup>
          <Collapsible defaultOpen={isOrdersActive || true}>
            <CollapsibleTrigger className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              {!collapsed && (
                <>
                  <span className="uppercase tracking-wider">Orders</span>
                  <ChevronDown className="ml-auto h-3 w-3" />
                </>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {ordersNav.map(item => (
                    <NavItem key={item.url} item={item} isActive={isActive(item.url)} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Bottom nav */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNav.map(item => (
                <NavItem key={item.url} item={item} isActive={isActive(item.url)} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3 space-y-2">
        {!collapsed ? (
          <>
            <button className="w-full flex items-center justify-center gap-1.5 rounded-md border border-sidebar-border px-3 py-1.5 text-[11px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
              <Link2 className="h-3 w-3" />
              Connect to ERP/WMS
            </button>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Version 24.1.19<br />&copy; 2026 Cleverence
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
