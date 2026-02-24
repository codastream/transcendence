import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

/**
 * PublicRoute — Route guard pour les pages réservées aux utilisateurs NON authentifiés.
 *
 * Comportement :
 * - isAuthChecked === false : affiche un loader
 * - isLoggedIn === true     : redirige vers state.from (page précédente) ou /home
 * - isLoggedIn === false    : rend les routes enfants via <Outlet />
 *
 * Après un login réussi, le composant LoginForm appelle login() ce qui rend
 * isLoggedIn true → PublicRoute redirige automatiquement vers la bonne page.
 *
 * IMPORTANT : `replace` est obligatoire ici.
 * Sans `replace`, chaque redirect après login crée une entrée d'historique.
 * Back-button → /welcome → PublicRoute re-redirige → forward, créant un cycle infini.
 * Avec `replace`, /welcome est supprimé de l'historique
 */
export const PublicRoute = () => {
  const { isLoggedIn, isAuthChecked } = useAuth();
  const location = useLocation();

  if (!isAuthChecked) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isLoggedIn) {
    // Reconstruit la destination complète (pathname + search)
    const from = location.state?.from;
    const destination = from?.pathname ? `${from.pathname}${from.search || ''}` : '/home';
    // replace : supprime /welcome de l'historique pour éviter le cycle back-button
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
};
