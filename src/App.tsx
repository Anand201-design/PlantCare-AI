import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { AnalyzePlant } from "./pages/AnalyzePlant";
import { PlantResult } from "./pages/PlantResult";
import { History } from "./pages/History";
import { MyPlants } from "./pages/MyPlants";
import { CareRecommendations } from "./pages/CareRecommendations";
import { PlantProfile } from "./pages/PlantProfile";
import { Settings } from "./pages/Settings";
import { Leaf, Menu } from "lucide-react";

const AppContent: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F6F9F5] dark:bg-[#0F231B] text-[#163A2D] dark:text-[#F1F7F3] font-sans antialiased transition-colors duration-200">
      {/* Mobile Top Header (visible on < lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white dark:bg-[#173126] border-b border-[#DCE7DF] dark:border-[#244737] px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center text-[#176B4D] dark:text-[#8EAD9B]">
            <Leaf className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg text-[#163A2D] dark:text-[#F1F7F3]">
            PlantCare <span className="text-[#176B4D] dark:text-[#8EAD9B]">AI</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 rounded-xl text-[#163A2D] dark:text-[#B0C9BA] hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Desktop Fixed Sidebar (visible on lg+) */}
      <div className="hidden lg:block sticky top-0 h-screen shrink-0 overflow-y-auto">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#163A2D]/30 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-[85vw] h-full bg-white dark:bg-[#173126] shadow-xl overflow-y-auto">
            <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-5 sm:px-7 lg:px-10 py-6 sm:py-8 lg:py-9 max-w-[1440px] mx-auto w-full">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analyze" element={<AnalyzePlant />} />
          <Route path="/results/:id" element={<PlantResult />} />
          <Route path="/history" element={<History />} />
          <Route path="/plants" element={<MyPlants />} />
          <Route path="/plants/:id" element={<PlantProfile />} />
          <Route path="/care" element={<CareRecommendations />} />
          <Route path="/recommendations" element={<CareRecommendations />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
