import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Catalog from "./pages/Catalog";
import ProductPage from "./pages/ProductPage";
import Cabinet from "./pages/Cabinet";
import Admin from "./pages/Admin";
import HowItWorks from "./pages/HowItWorks";
import Forum from "./pages/Forum";
import ForumTopic from "./pages/ForumTopic";
import Offer from "./pages/Offer";
import Rules from "./pages/Rules";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import TelegramCallback from "./pages/TelegramCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalog/:id" element={<ProductPage />} />
            <Route path="/cabinet" element={<Cabinet />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/:id" element={<ForumTopic />} />
            <Route path="/offer" element={<Offer />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/auth/telegram/callback" element={<TelegramCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;