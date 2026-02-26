import { Route, Routes } from 'react-router-dom';
import { MyProfilePage } from './pages/MyProfilePage';
import { ProfilePage } from './pages/ProfilePage';
import { GamePage } from './pages/GamePage';
import { useAuth } from './providers/AuthProvider';
import { AnimationPage } from './pages/AnimationPage';
import { FriendsPage } from './pages/FriendsPage';
import { WelcomePage } from './pages/WelcomePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlayAiPage } from './pages/PlayAiPage';
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
          <Route
            path="/game/remote"
            element={<GamePage sessionId={null} gameMode={'remote'} />}
          ></Route>
          <Route
            path="/game/local"
            element={<GamePage sessionId={null} gameMode={'local'} />}
          ></Route>
          <Route
            path="/game/tournament/:tournamentId"
            element={<GamePage sessionId={null} gameMode={'tournament'} />}
          ></Route>
          <Route path="/me" element={<MyProfilePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/tournaments/*" element={<TournamentRoutes />} />
          <Route path="/game/pong-ai" element={<PlayAiPage />} />
        </Route>

        {/* Catch-all — toute URL non reconnue */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  );
};
