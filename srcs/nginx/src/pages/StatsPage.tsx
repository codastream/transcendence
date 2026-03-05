import { useState, useEffect } from 'react';
import { PlayerStat, StatsTableDesktop, StatsListMobile } from '../components/atoms/PlayerStats';
import api from '../api/api-client';

interface match {
  id: number;
  tournament_id: number | null;
  player1: number;
  player2: number;
  score_player1: number | null;
  score_player2: number | null;
  winner_id: number | null;
}

interface tournament_stats {
  tournament_id: number;
  player_id: number;
  final_position: number;
}

export const StatsPage = () => {
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<PlayerStat[]>('/game/stats');
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <>
      <div className="hidden md:block w-full">
        <StatsTableDesktop stats={stats} />
      </div>
      <div className="md:hidden w-full">
        <StatsListMobile stats={stats} />
      </div>
    </>
  );
};
