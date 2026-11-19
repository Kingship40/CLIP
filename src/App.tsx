import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useTheme } from './hooks/useTheme';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewProjectPage } from './pages/NewProjectPage';
import { ProjectLibraryPage } from './pages/ProjectLibraryPage';
import { ProjectWorkspacePage } from './pages/ProjectWorkspacePage';
import { ClipEditorPage } from './pages/ClipEditorPage';
import { SettingsPage } from './pages/SettingsPage';
import { SeedancePlaygroundPage } from './pages/SeedancePlaygroundPage';
import { NotFoundPage } from './pages/NotFoundPage';

function ThemeApplier() {
  useTheme();
  return null;
}

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeApplier />
      <Routes>
        {/* Public Marketing & Auth Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Authenticated / Studio Workspace Routes inside AppShell */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/new" element={<NewProjectPage />} />
          <Route path="/dashboard/projects" element={<ProjectLibraryPage />} />
          <Route path="/dashboard/projects/:id" element={<ProjectWorkspacePage />} />
          <Route path="/dashboard/clips/:id" element={<ClipEditorPage />} />
          <Route path="/dashboard/seedance" element={<SeedancePlaygroundPage />} />
          <Route path="/ai-playground/app" element={<SeedancePlaygroundPage />} />
          <Route path="/playground" element={<SeedancePlaygroundPage />} />
          <Route path="/seedance" element={<SeedancePlaygroundPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
