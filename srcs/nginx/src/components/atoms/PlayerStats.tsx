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
    <div className="overflow-x-auto rounded-lg border border-slate-700">
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
          {stats.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-sm">
                {t('stats.empty', 'No players yet.')}
              </td>
            </tr>
          )}
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
                    row.tournaments_won > 0 ? 'text-teal-300 font-semibold' : 'text-slate-400'
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
                    row.matches_won > 0 ? 'text-teal-300 font-semibold' : 'text-slate-400'
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
  );
};

// ── Mobile cards ───────────────────────────────────────────────────────────
export const StatsListMobile = ({ stats }: { stats: PlayerStat[] }) => {
  const { t } = useTranslation();
  if (stats.length === 0)
    return (
      <p className="text-slate-400 text-sm">{t('stats.empty', 'No players yet.')}</p>
    );
  return (
    <>
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
                    highlight ? 'text-teal-300 font-semibold' : 'text-slate-100 font-semibold'
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
