import { useTranslation } from 'react-i18next';
import { DataTable, DataCardList } from '../molecules/DataTable';

export interface PlayerStat {
  player_id: number;
  username: string;
  tournaments_played: number;
  tournaments_won: number;
  matches_played: number;
  matches_won: number;
}

export const StatsTableDesktop = ({ stats }: { stats: PlayerStat[] }) => {
  const { t } = useTranslation();
  return (
    <DataTable<PlayerStat>
      title={t('stats.title', 'Player Statistics')}
      rowKey={(row) => row.player_id}
      rows={stats}
      emptyMessage={t('stats.empty', 'No players yet.')}
      columns={[
        {
          header: t('stats.player', 'Player'),
          cell: (row) => <span className="font-bold text-gray-700">{row.username}</span>,
        },
        {
          header: t('stats.tournaments_played', 'Tournaments Played'),
          cell: (row) => <span className="text-gray-600">{row.tournaments_played}</span>,
        },
        {
          header: t('stats.tournaments_won', 'Tournaments Won'),
          cell: (row) => (
            <span
              className={row.tournaments_won > 0 ? 'font-medium text-emerald-600' : 'text-gray-500'}
            >
              {row.tournaments_won}
            </span>
          ),
        },
        {
          header: t('stats.matches_played', 'Matches Played'),
          cell: (row) => <span className="text-gray-600">{row.matches_played}</span>,
        },
        {
          header: t('stats.matches_won', 'Matches Won'),
          className: 'text-right',
          cell: (row) => (
            <span
              className={row.matches_won > 0 ? 'font-medium text-emerald-600' : 'text-gray-500'}
            >
              {row.matches_won}
            </span>
          ),
        },
      ]}
    />
  );
};

export const StatsListMobile = ({ stats }: { stats: PlayerStat[] }) => {
  const { t } = useTranslation();
  return (
    <DataCardList<PlayerStat>
      rows={stats}
      rowKey={(row) => row.player_id}
      emptyMessage={t('stats.empty', 'No players yet.')}
      renderCard={(row) => (
        <>
          <div className="font-semibold text-gray-700 text-base">{row.username}</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {(
              [
                [
                  t('stats.tournaments_played', 'Tournaments Played'),
                  row.tournaments_played,
                  false,
                ],
                [
                  t('stats.tournaments_won', 'Tournaments Won'),
                  row.tournaments_won,
                  row.tournaments_won > 0,
                ],
                [t('stats.matches_played', 'Matches Played'), row.matches_played, false],
                [t('stats.matches_won', 'Matches Won'), row.matches_won, row.matches_won > 0],
              ] as [string, number, boolean][]
            ).map(([label, value, highlight]) => (
              <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
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
        </>
      )}
    />
  );
};
