import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Background from '../components/atoms/Background';
import { NavBar } from '../components/molecules/NavBar';
// import api from '../api/api-client';

// ── Types ──────────────────────────────────────────────────────────────────
interface PlayerStat {
  player_id: number;
  username: string;
  tournaments_played: number;
  tournaments_won: number;
  matches_played: number;
  matches_won: number;
}

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
  {
    id: 1,
    tournament_id: 1,
    player1: 1,
    player2: 2,
    score_player1: 5,
    score_player2: 2,
    winner_id: 1,
  },
  {
    id: 2,
    tournament_id: 1,
    player1: 3,
    player2: 4,
    score_player1: 5,
    score_player2: 0,
    winner_id: 3,
  },
  {
    id: 3,
    tournament_id: 1,
    player1: 1,
    player2: 3,
    score_player1: 5,
    score_player2: 4,
    winner_id: 1,
  },
  {
    id: 4,
    tournament_id: 1,
    player1: 2,
    player2: 4,
    score_player1: 5,
    score_player2: 3,
    winner_id: 2,
  },
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

const colors = { start: '#00ff9f', end: '#0088ff' };

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
    <div className="w-full h-full relative flex flex-col min-h-screen">
      <Background
        grainIntensity={4}
        baseFrequency={0.28}
        colorStart={colors.start}
        colorEnd={colors.end}
      >
        <div className="sticky top-0 z-20">
          <NavBar />
        </div>

        <div className="flex justify-center px-4 py-8">
          <div className="w-full max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-100 mb-6 tracking-wide uppercase">
              📊 {t('stats.title', 'Player Statistics')}
            </h1>

            {stats.length === 0 && (
              <p className="text-slate-400 text-sm">{t('stats.empty', 'No players yet.')}</p>
            )}

            {stats.length > 0 && (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-700">
                  <table className="min-w-full text-sm text-slate-200">
                    <thead className="bg-teal-800/40 text-slate-300 uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">{t('stats.player', 'Player')}</th>
                        <th className="px-4 py-3 text-center">
                          {t('stats.tournaments_played', 'Tournaments Played')}
                        </th>
                        <th className="px-4 py-3 text-center">
                          {t('stats.tournaments_won', 'Tournaments Won')}
                        </th>
                        <th className="px-4 py-3 text-center">
                          {t('stats.matches_played', 'Matches Played')}
                        </th>
                        <th className="px-4 py-3 text-center">
                          {t('stats.matches_won', 'Matches Won')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((row, i) => (
                        <tr
                          key={row.player_id}
                          className={`border-t border-slate-700/50 hover:bg-teal-800/10 transition-colors ${
                            i % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-800/40'
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-slate-100">{row.username}</td>
                          <td className="px-4 py-3 text-center text-slate-300">
                            {row.tournaments_played}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={
                                row.tournaments_won > 0
                                  ? 'text-teal-300 font-semibold'
                                  : 'text-slate-400'
                              }
                            >
                              {row.tournaments_won}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-300">
                            {row.matches_played}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={
                                row.matches_won > 0
                                  ? 'text-teal-300 font-semibold'
                                  : 'text-slate-400'
                              }
                            >
                              {row.matches_won}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-4">
                  {stats.map((row) => (
                    <div
                      key={row.player_id}
                      className="bg-slate-800/60 rounded-lg border border-slate-700 p-4 space-y-3"
                    >
                      <div className="text-slate-100 font-semibold text-base">{row.username}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {[
                          {
                            label: t('stats.tournaments_played', 'Tournaments Played'),
                            value: row.tournaments_played,
                            highlight: false,
                          },
                          {
                            label: t('stats.tournaments_won', 'Tournaments Won'),
                            value: row.tournaments_won,
                            highlight: row.tournaments_won > 0,
                          },
                          {
                            label: t('stats.matches_played', 'Matches Played'),
                            value: row.matches_played,
                            highlight: false,
                          },
                          {
                            label: t('stats.matches_won', 'Matches Won'),
                            value: row.matches_won,
                            highlight: row.matches_won > 0,
                          },
                        ].map(({ label, value, highlight }) => (
                          <div key={label} className="bg-slate-700/50 rounded p-2 text-center">
                            <div className="text-slate-400 text-xs mb-1">{label}</div>
                            <div
                              className={
                                highlight
                                  ? 'text-teal-300 font-semibold'
                                  : 'text-slate-100 font-semibold'
                              }
                            >
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Background>
    </div>
  );
};
