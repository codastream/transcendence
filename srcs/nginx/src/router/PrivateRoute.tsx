import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

/**
 * PrivateRoute — Route guard pour les pages nécessitant une authentification.
 *
 * Comportement :
 * - isAuthChecked === false : affiche un loader
 * - isLoggedIn === false    : redirige vers /welcome avec state.from
 * - isLoggedIn === true     : rend les routes enfants via <Outlet />
 *
 * Usage dans App.tsx :
 *   <Route element={<PrivateRoute />}>
 *     <Route path="/profile/:username" element={<ProfilePage />} />
 *   </Route>
 *
 * Le pattern Outlet évite de wrapper chaque route manuellement
 */
export const PrivateRoute = () => {
  const { isLoggedIn, isAuthChecked } = useAuth();
  const location = useLocation();

  if (!isAuthChecked) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/welcome"
        state={{ from: { pathname: location.pathname, search: location.search } }}
        replace
      />
    );
  }

  return <Outlet />;
};
