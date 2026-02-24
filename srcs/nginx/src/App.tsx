import { Navigate, Route, Routes } from 'react-router-dom';
import { ProfilePage } from './pages/ProfilePage';
import { useAuth } from './providers/AuthProvider';
import { AnimationPage } from './pages/AnimationPage';
import { FriendsPage } from './pages/FriendsPage';
import { WelcomePage } from './pages/WelcomePage';
import TournamentRoutes from './router/TournamentRoutes';

const MeRedirect = () => {
  const { user, isAuthChecked } = useAuth();

  if (!isAuthChecked) {
    return null;
  }

  if (!user || !user.username) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/profile/${user.username}`} replace />;
};

export const App = () => {
  return (
    <main className="h-screen bd-slate-950 text-slate-100">
      <Routes>
        <Route path="/" element={<AnimationPage />}></Route>

        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/me" element={<MeRedirect />}></Route>
        <Route path="/friends" element={<FriendsPage />}></Route>
        <Route path="/profile/:username" element={<ProfilePage />}></Route>
        <Route path="/tournaments/*" element={<TournamentRoutes />} />
      </Routes>
    </main>
  );
};
