import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PlayerDTO } from '@transcendence/core';
import api from '../api/api-client';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export const TournamentGuard = () => {
  const { id } = useParams<{ id: string }>();

  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    const checkTournament = async () => {
      try {
        await api.get(`/game/tournaments/${id}`);
        setExists(true);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setExists(false);
        } else {
          // erreur réseau ou autre → à décider
          setExists(false);
        }
      }
    };

    if (id) checkTournament();
  }, [id]);

  // en attente
  if (exists === null) return null;

  // tournoi inexistant
  if (!exists) {
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
};
