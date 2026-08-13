import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Index from "./pages/Index";
import LumniMenores from "./pages/LumniMenores";
import LumniMayores from "./pages/LumniMayores";
import RPMenores from "./pages/RPMenores";
import RPMayores from "./pages/RPMayores";
import BulkGeneration from "./pages/BulkGeneration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Se requiere VITE_GOOGLE_CLIENT_ID en el archivo .env
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "TU_CLIENT_ID_AQUI";

const App = () => (
  <GoogleOAuthProvider clientId={googleClientId}>
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
            <Route path="/masivo-rp" element={<BulkGeneration />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
