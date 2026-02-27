import { useTranslation } from 'react-i18next';

// ── Types ──────────────────────────────────────────────────────────────────
export interface PlayerStat {
  player_id: number;
  username: string;
  tournaments_played: number;
  tournaments_won: number;
  matches_played: number;
  matches_won: number;
}

// ── Desktop table ──────────────────────────────────────────────────────────
export const StatsTableDesktop = ({ stats }: { stats: PlayerStat[] }) => {
  const { t } = useTranslation();
  return (
    <div className="w-[70%] max-w-5xl mx-auto my-12">
      <div className="bg-white/70 rounded-3xl shadow-2xl p-8 border border-cyan-300">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700 font-quantico">
          {t('stats.title', 'Player Statistics')}
        </h2>
        <div className="overflow-hidden rounded-2xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-4 px-4">{t('stats.player', 'Player')}</th>
                <th className="py-4 px-4">{t('stats.tournaments_played', 'Tournaments Played')}</th>
                <th className="py-4 px-4">{t('stats.tournaments_won', 'Tournaments Won')}</th>
                <th className="py-4 px-4">{t('stats.matches_played', 'Matches Played')}</th>
                <th className="py-4 px-4 text-right">{t('stats.matches_won', 'Matches Won')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    {t('stats.empty', 'No players yet.')}
                  </td>
                </tr>
              )}
              {stats.map((row) => (
                <tr key={row.player_id} className="hover:bg-white/20 transition-colors">
                  <td className="py-4 px-4 font-bold text-gray-700">{row.username}</td>
                  <td className="py-4 px-4 text-gray-600">{row.tournaments_played}</td>
                  <td className="py-4 px-4">
                    <span
                      className={
                        row.tournaments_won > 0 ? 'font-medium text-emerald-600' : 'text-gray-500'
                      }
                    >
                      {row.tournaments_won}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{row.matches_played}</td>
                  <td className="py-4 px-4 text-right">
                    <span
                      className={
                        row.matches_won > 0 ? 'font-medium text-emerald-600' : 'text-gray-500'
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
      </div>
    </div>
  );
};

// ── Mobile cards ───────────────────────────────────────────────────────────
export const StatsListMobile = ({ stats }: { stats: PlayerStat[] }) => {
  const { t } = useTranslation();
  if (stats.length === 0)
    return (
      <p className="text-center text-gray-500 py-10">
        {t('stats.empty', 'No players yet.')}
      </p>
    );
  return (
    <>
      {stats.map((row) => (
        <div
          key={row.player_id}
          className="bg-white/80 backdrop-blur rounded-2xl p-4 m-4 shadow flex flex-col gap-3"
        >
          <div className="font-semibold text-gray-700 text-base">{row.username}</div>
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
              <div key={label} className="bg-white/60 rounded-xl p-2 text-center">
                <div className="text-gray-500 text-xs mb-1">{label}</div>
                <div
                  className={
                    highlight ? 'text-emerald-600 font-semibold' : 'text-gray-700 font-semibold'
                  }
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
};
