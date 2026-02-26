import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Background from '../components/atoms/Background';
import { NavBar } from '../components/molecules/NavBar';
import api from '../api/api-client';

interface TournamentStat {
  tournament_id: number;
  status: 'PENDING' | 'STARTED' | 'FINISHED';
  created_at: number;
  creator: string;
  player_count: number;
  match_count: number;
  winner: string;
}

const colors = {
  start: '#00ff9f',
  end: '#0088ff',
};

const statusBadge = (status: TournamentStat['status']) => {
  const base = 'px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide';
  if (status === 'FINISHED') return `${base} bg-green-700 text-green-100`;
  if (status === 'STARTED') return `${base} bg-yellow-600 text-yellow-100`;
  return `${base} bg-slate-600 text-slate-200`;
};

export const StatsPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<TournamentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get<TournamentStat[]>('/game/stats');
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
          <div className="w-full max-w-5xl">
            <h1 className="text-2xl font-bold text-slate-100 mb-6 tracking-wide uppercase">
              📊 {t('stats.title', 'Tournament Statistics')}
            </h1>

            {loading && (
              <p className="text-slate-400 text-sm">{t('stats.loading', 'Loading...')}</p>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {!loading && !error && stats.length === 0 && (
              <p className="text-slate-400 text-sm">{t('stats.empty', 'No tournaments yet.')}</p>
            )}

            {!loading && !error && stats.length > 0 && (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-700">
                  <table className="min-w-full text-sm text-slate-200">
                    <thead className="bg-teal-800/40 text-slate-300 uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">{t('stats.creator', 'Creator')}</th>
                        <th className="px-4 py-3 text-left">{t('stats.status', 'Status')}</th>
                        <th className="px-4 py-3 text-center">{t('stats.players', 'Players')}</th>
                        <th className="px-4 py-3 text-center">{t('stats.matches', 'Matches')}</th>
                        <th className="px-4 py-3 text-left">{t('stats.winner', 'Winner')}</th>
                        <th className="px-4 py-3 text-left">{t('stats.date', 'Date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((row, i) => (
                        <tr
                          key={row.tournament_id}
                          className={`border-t border-slate-700/50 hover:bg-teal-800/10 transition-colors ${
                            i % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-800/40'
                          }`}
                        >
                          <td className="px-4 py-3 text-slate-400">{row.tournament_id}</td>
                          <td className="px-4 py-3 font-medium">{row.creator}</td>
                          <td className="px-4 py-3">
                            <span className={statusBadge(row.status)}>{row.status}</span>
                          </td>
                          <td className="px-4 py-3 text-center">{row.player_count} / 4</td>
                          <td className="px-4 py-3 text-center">{row.match_count}</td>
                          <td className="px-4 py-3 font-semibold text-teal-300">
                            {row.status === 'FINISHED' ? row.winner : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {new Date(row.created_at).toLocaleString()}
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
                      key={row.tournament_id}
                      className="bg-slate-800/60 rounded-lg border border-slate-700 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs">#{row.tournament_id}</span>
                        <span className={statusBadge(row.status)}>{row.status}</span>
                      </div>
                      <div className="text-slate-100 font-medium">{row.creator}</div>
                      <div className="flex gap-4 text-sm text-slate-300">
                        <span>👥 {row.player_count} / 4</span>
                        <span>
                          🎮 {row.match_count} {t('stats.matches', 'matches')}
                        </span>
                      </div>
                      {row.status === 'FINISHED' && (
                        <div className="text-teal-300 font-semibold text-sm">🏆 {row.winner}</div>
                      )}
                      <div className="text-slate-500 text-xs">
                        {new Date(row.created_at).toLocaleString()}
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
