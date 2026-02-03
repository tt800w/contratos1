import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LumniMenores from "./pages/LumniMenores";
import LumniMayores from "./pages/LumniMayores";
import RP123Menores from "./pages/RP123Menores";
import RP123Mayores from "./pages/RP123Mayores";
import RP56Menores from "./pages/RP56Menores";
import RP56Mayores from "./pages/RP56Mayores";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/lumni-menores" element={<LumniMenores />} />
          <Route path="/lumni-mayores" element={<LumniMayores />} />
          <Route path="/rp-123-menores" element={<RP123Menores />} />
          <Route path="/rp-123-mayores" element={<RP123Mayores />} />
          <Route path="/rp-56-menores" element={<RP56Menores />} />
          <Route path="/rp-56-mayores" element={<RP56Mayores />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
