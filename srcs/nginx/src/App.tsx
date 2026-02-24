import { Route, Routes } from 'react-router-dom';
import { MyProfilePage } from './pages/MyProfilePage';
import { ProfilePage } from './pages/ProfilePage';
import { AnimationPage } from './pages/AnimationPage';
import { FriendsPage } from './pages/FriendsPage';
import { WelcomePage } from './pages/WelcomePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import TournamentRoutes from './router/TournamentRoutes';
import { PrivateRoute } from './router/PrivateRoute';
import { PublicRoute } from './router/PublicRoute';

export const App = () => {
  return (
    <main className="h-screen bg-slate-950 text-slate-100">
      <Routes>
        {/* Route publique sans guard — animation d'intro */}
        <Route path="/" element={<AnimationPage />} />

        {/* Routes réservées aux non-authentifiés */}
        <Route element={<PublicRoute />}>
          <Route path="/welcome" element={<WelcomePage />} />
        </Route>

        {/* Routes protégées — authentification requise */}
        <Route element={<PrivateRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/me" element={<MyProfilePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/tournaments/*" element={<TournamentRoutes />} />
        </Route>

        {/* Catch-all — toute URL non reconnue */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  );
};
