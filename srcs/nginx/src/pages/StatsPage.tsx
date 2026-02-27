import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlayerStat,
  StatsTableDesktop,
  StatsListMobile,
} from '../components/atoms/PlayerStats';
// import api from '../api/api-client';

// ── Types (local, kept for mock builder) ──────────────────────────────────
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

// ── Mock data ──────────────────────────────────────────────────────────────
const MOCK_MATCH_STATS: match[] = [
  { id: 1, tournament_id: 1, player1: 1, player2: 2, score_player1: 5, score_player2: 2, winner_id: 1 },
  { id: 2, tournament_id: 1, player1: 3, player2: 4, score_player1: 5, score_player2: 0, winner_id: 3 },
  { id: 3, tournament_id: 1, player1: 1, player2: 3, score_player1: 5, score_player2: 4, winner_id: 1 },
  { id: 4, tournament_id: 1, player1: 2, player2: 4, score_player1: 5, score_player2: 3, winner_id: 2 },
];

const MOCK_TOURNAMENTS_STATS: tournament_stats[] = [
  { tournament_id: 1, player_id: 1, final_position: 1 },
  { tournament_id: 1, player_id: 2, final_position: 3 },
  { tournament_id: 1, player_id: 3, final_position: 2 },
  { tournament_id: 1, player_id: 4, final_position: 4 },
];

function buildMockStats(): PlayerStat[] {
  const playerIds = [
    ...new Set([
      ...MOCK_MATCH_STATS.map((m) => m.player1),
      ...MOCK_MATCH_STATS.map((m) => m.player2),
    ]),
  ];
  return playerIds
    .map((pid) => {
      const matches = MOCK_MATCH_STATS.filter((m) => m.player1 === pid || m.player2 === pid);
      const tournamentsPlayed = [
        ...new Set(
          MOCK_TOURNAMENTS_STATS.filter((t) => t.player_id === pid).map((t) => t.tournament_id),
        ),
      ].length;
      const tournamentsWon = MOCK_TOURNAMENTS_STATS.filter(
        (t) => t.player_id === pid && t.final_position === 1,
      ).length;
      return {
        player_id: pid,
        username: `Player #${pid}`,
        tournaments_played: tournamentsPlayed,
        tournaments_won: tournamentsWon,
        matches_played: matches.length,
        matches_won: matches.filter((m) => m.winner_id === pid).length,
      };
    })
    .sort((a, b) => b.tournaments_won - a.tournaments_won || b.matches_won - a.matches_won);
}

export const StatsPage = () => {
  const { t } = useTranslation();
  const [stats] = useState<PlayerStat[]>(buildMockStats());

  // useEffect(() => {
  //   const fetchStats = async () => {
  //     setLoading(true);
  //     try {
  //       const { data } = await api.get<PlayerStat[]>('/game/stats');
  //       setStats(data);
  //     } catch (err) {
  //       console.error(err);
  //       setStats(buildMockStats());
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchStats();
  // }, []);

  return (
    <div className="flex flex-col w-full max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-6 tracking-wide uppercase">
        📊 {t('stats.title', 'Player Statistics')}
      </h1>
      <div className="hidden md:block w-full">
        <StatsTableDesktop stats={stats} />
      </div>
      <div className="md:hidden space-y-4 w-full">
        <StatsListMobile stats={stats} />
      </div>
    </div>
  );
};
