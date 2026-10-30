import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { DocumentProvider, useDocument } from './context/DocumentContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/Toast';
import { AuthModal } from './components/auth/AuthModal';

import { LandingPage } from './components/landing/LandingPage';
import { EditorWorkspace } from './components/editor/EditorWorkspace';
import { ToolsWorkspace } from './components/tools/ToolsWorkspace';
import { DashboardView } from './components/dashboard/DashboardView';
import { MyDocumentsView } from './components/documents/MyDocumentsView';
import { SettingsView } from './components/settings/SettingsView';

const AppContent: React.FC = () => {
  const { currentView } = useDocument();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1">
        {currentView === 'landing' && <LandingPage />}
        {currentView === 'editor' && <EditorWorkspace />}
        {currentView === 'tools' && <ToolsWorkspace />}
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'documents' && <MyDocumentsView />}
        {currentView === 'settings' && <SettingsView />}
      </main>

      {/* Footer is displayed everywhere except full-screen Editor */}
      {currentView !== 'editor' && <Footer />}

      <AuthModal />
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DocumentProvider>
          <AppContent />
        </DocumentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
