import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Background from '../components/atoms/Background';
import { NavBar } from '../components/molecules/NavBar';
import api from '../api/api-client';

interface PlayerStat {
  player_id: number;
  username: string;
  tournaments_played: number;
  tournaments_won: number;
  matches_played: number;
  matches_won: number;
}

const colors = {
  start: '#00ff9f',
  end: '#0088ff',
};

export const StatsPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get<PlayerStat[]>('/game/stats');
        setStats(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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

            {loading && (
              <p className="text-slate-400 text-sm">{t('stats.loading', 'Loading...')}</p>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {!loading && !error && stats.length === 0 && (
              <p className="text-slate-400 text-sm">{t('stats.empty', 'No players yet.')}</p>
            )}

            {!loading && !error && stats.length > 0 && (
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
                        <div className="bg-slate-700/50 rounded p-2 text-center">
                          <div className="text-slate-400 text-xs mb-1">
                            {t('stats.tournaments_played', 'Tournaments Played')}
                          </div>
                          <div className="text-slate-100 font-semibold">
                            {row.tournaments_played}
                          </div>
                        </div>
                        <div className="bg-slate-700/50 rounded p-2 text-center">
                          <div className="text-slate-400 text-xs mb-1">
                            {t('stats.tournaments_won', 'Tournaments Won')}
                          </div>
                          <div
                            className={
                              row.tournaments_won > 0
                                ? 'text-teal-300 font-semibold'
                                : 'text-slate-400 font-semibold'
                            }
                          >
                            {row.tournaments_won}
                          </div>
                        </div>
                        <div className="bg-slate-700/50 rounded p-2 text-center">
                          <div className="text-slate-400 text-xs mb-1">
                            {t('stats.matches_played', 'Matches Played')}
                          </div>
                          <div className="text-slate-100 font-semibold">{row.matches_played}</div>
                        </div>
                        <div className="bg-slate-700/50 rounded p-2 text-center">
                          <div className="text-slate-400 text-xs mb-1">
                            {t('stats.matches_won', 'Matches Won')}
                          </div>
                          <div
                            className={
                              row.matches_won > 0
                                ? 'text-teal-300 font-semibold'
                                : 'text-slate-400 font-semibold'
                            }
                          >
                            {row.matches_won}
                          </div>
                        </div>
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
