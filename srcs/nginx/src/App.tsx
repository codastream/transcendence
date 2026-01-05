import { Navigate, Route, Routes } from 'react-router-dom';
import { MePage } from './pages/MePage';
import { ProfilePage } from './pages/ProfilePage';

export const App = () => {
  return (
    <main className="min-h-screen bd-slate-950 text-slate-100">
      <Routes>
        <Route path="/me" element={<MePage />}></Route>
        <Route path="/" element={<Navigate to="/me" replace />}></Route>
      </Routes>
      <ProfilePage></ProfilePage>
    </main>
  );
};
