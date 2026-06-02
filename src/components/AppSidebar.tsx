import {
  LayoutDashboard, Map, Package, ClipboardList, Plus, UserCheck,
  Send, CheckCircle, XCircle, Route, Users, Truck, BarChart3, Settings,
  ChevronDown, Link2,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useDelivery } from '@/contexts/DeliveryContext';

const mainNav = [
  { title: 'Dashboard', url: '/',    icon: LayoutDashboard },
  { title: 'Map',       url: '/map', icon: Map },
];

const inventoryNav = [
  { title: 'Items', url: '/inventory/items', icon: Package },
];

// Orders in the exact sequence requested:
// All Orders → New Orders → Assign Orders → In Transit → Delivered → Cancelled → Dispatch & Routes
const ordersNav = [
  { title: 'All Orders',      url: '/orders/all',       icon: ClipboardList, badge: false },
  { title: 'New Orders',      url: '/orders/new',       icon: Plus,          badge: true  },
  { title: 'Assign Orders',   url: '/orders/assign',    icon: UserCheck,     badge: false },
  { title: 'In Transit',      url: '/orders/in-transit',icon: Send,          badge: false },
  { title: 'Delivered',       url: '/orders/delivered', icon: CheckCircle,   badge: false },
  { title: 'Cancelled',       url: '/orders/cancelled', icon: XCircle,       badge: false },
  { title: 'Dispatch & Routes', url: '/dispatch',       icon: Route,         badge: false },
];

const bottomNav = [
  { title: 'Customers', url: '/customers', icon: Users },
  { title: 'Couriers',  url: '/couriers',  icon: Truck },
  { title: 'Reports',   url: '/reports',   icon: BarChart3 },
  { title: 'Settings',  url: '/settings',  icon: Settings },
];

function NavItem({ item, isActive, badge }: {
  item: { title: string; url: string; icon: React.ElementType };
  isActive: boolean;
  badge?: number;
}) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => navigate(item.url)}
        className={cn(
          'cursor-pointer transition-colors relative',
          isActive && 'bg-primary/15 text-primary border-l-2 border-primary font-medium'
        )}
        tooltip={item.title}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="flex-1">{item.title}</span>}
        {!collapsed && badge && badge > 0 && (
          <span className="ml-auto text-[10px] font-bold bg-primary text-white rounded-full px-1.5 py-0.5 leading-none">
            {badge}
          </span>
        )}
        {collapsed && badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {badge}
          </span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { orders } = useDelivery();
  const collapsed = state === 'collapsed';

  const isActive = (url: string) => {
    if (url === '/') return location.pathname === '/';
    if (url === '/map') return location.pathname === '/map';
    return location.pathname.startsWith(url);
  };

  const isOrdersActive  = location.pathname.startsWith('/orders') || location.pathname === '/dispatch';
  const isInventoryActive = location.pathname.startsWith('/inventory');
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

      <SidebarContent className="px-2 py-2">

        {/* Dashboard + Map */}
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
          <Collapsible defaultOpen={true}>
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
                    <NavItem
                      key={item.url}
                      item={item}
                      isActive={isActive(item.url)}
                      badge={item.badge ? newCount : undefined}
                    />
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
              Version 24.1.19&nbsp;·&nbsp;© 2026 Cleverence
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
