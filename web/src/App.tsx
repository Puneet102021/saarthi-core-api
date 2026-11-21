import { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth";
import { Brand } from "./components/Brand";
import AppShell from "./components/AppShell";
import AuthPage from "./pages/AuthPage";
import ChartPage from "./pages/ChartPage";
import ChatPage from "./pages/ChatPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

function Loading() {
  return (
    <div className="center-screen">
      <Brand />
      <p className="muted">Loading…</p>
    </div>
  );
}

/* Signed out → sign in; signed in but not onboarded → onboarding; otherwise the page. */
function Guard({ children, onboarding = false }: { children: ReactElement; onboarding?: boolean }) {
  const { me } = useAuth();
  if (me === undefined) return <Loading />;
  if (me === null) return <Navigate to="/signin" replace />;
  if (!onboarding && !me.onboardingCompleted) return <Navigate to="/welcome" replace />;
  return children;
}

export default function App() {
  const { me } = useAuth();

  return (
    <Routes>
      <Route
        path="/signin"
        element={me === undefined ? <Loading /> : me ? <Navigate to="/" replace /> : <AuthPage mode="signin" />}
      />
      <Route
        path="/signup"
        element={me === undefined ? <Loading /> : me ? <Navigate to="/" replace /> : <AuthPage mode="signup" />}
      />
      <Route
        path="/welcome"
        element={
          <Guard onboarding>
            <OnboardingPage />
          </Guard>
        }
      />
      <Route
        element={
          <Guard>
            <AppShell />
          </Guard>
        }
      >
        <Route path="/" element={<ChatPage />} />
        <Route path="/chart" element={<ChartPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
