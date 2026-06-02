import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DeliveryProvider } from "@/contexts/DeliveryContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import MapPage from "@/pages/MapPage";
import ItemsCatalog from "@/pages/ItemsCatalog";
import OrdersAll from "@/pages/OrdersAll";
import OrdersFiltered from "@/pages/OrdersFiltered";
import OrderDetail from "@/pages/OrderDetail";
import CreateOrder from "@/pages/CreateOrder";
import AssignOrders from "@/pages/AssignOrders";
import DispatchPage from "@/pages/DispatchPage";
import CustomersPage from "@/pages/CustomersPage";
import CustomerDetail from "@/pages/CustomerDetail";
import CouriersPage from "@/pages/CouriersPage";
import ReportsPage from "@/pages/ReportsPage";
import StubPage from "@/pages/StubPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DeliveryProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/inventory/items" element={<ItemsCatalog />} />
              <Route path="/orders/all" element={<OrdersAll />} />
              <Route path="/orders/new" element={<OrdersFiltered status="New" />} />
              <Route path="/orders/in-transit" element={<OrdersFiltered status="In Transit" />} />
              <Route path="/orders/delivered" element={<OrdersFiltered status="Delivered" />} />
              <Route path="/orders/cancelled" element={<OrdersFiltered status="Cancelled" />} />
              <Route path="/orders/assign" element={<AssignOrders />} />
              <Route path="/dispatch" element={<DispatchPage />} />
              <Route path="/orders/create" element={<CreateOrder />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/couriers" element={<CouriersPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<StubPage title="Settings" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DeliveryProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
