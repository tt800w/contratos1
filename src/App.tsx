import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LumniMenores from "./pages/LumniMenores";
import LumniMayores from "./pages/LumniMayores";
import RPMenores from "./pages/RPMenores";
import RPMayores from "./pages/RPMayores";
import NotFound from "./pages/NotFound";

import PPMenores from "./pages/PPMenores";
import PPMayores from "./pages/PPMayores";

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
          <Route path="/rp-menores" element={<RPMenores />} />
          <Route path="/rp-mayores" element={<RPMayores />} />
          <Route path="/pp-menores" element={<PPMenores />} />
          <Route path="/pp-mayores" element={<PPMayores />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
