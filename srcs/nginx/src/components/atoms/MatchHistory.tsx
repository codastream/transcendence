import { useTranslation } from 'react-i18next';

// ── Types ──────────────────────────────────────────────────────────────────
export interface MatchHistory {
  id: number;
  tournament_id: number | null;
  round: string | null;
  score_player1: number | null;
  score_player2: number | null;
  winner_id: number | null;
  created_at: number;
  username_player1: string;
  username_player2: string;
  username_winner: string | null;
}

const roundLabel: Record<string, string> = {
  SEMI_1: 'Semi-final 1',
  SEMI_2: 'Semi-final 2',
  LITTLE_FINAL: '3rd Place',
  FINAL: 'Final',
};

// ── Desktop table ──────────────────────────────────────────────────────────
export const HistoryTableDesktop = ({ history }: { history: MatchHistory[] }) => {
  const { t } = useTranslation();
  return (
    <div className="w-[70%] max-w-5xl mx-auto my-12">
      <div className="bg-white/70 rounded-3xl shadow-2xl p-8 border border-cyan-300">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700 font-quantico">
          {t('history.title', 'Match History')}
        </h2>
        <div className="overflow-hidden rounded-2xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-4 px-4">Round</th>
                <th className="py-4 px-4">Player 1</th>
                <th className="py-4 px-4 text-center">Score</th>
                <th className="py-4 px-4">Player 2</th>
                <th className="py-4 px-4">Winner</th>
                <th className="py-4 px-4 text-right">Tournament</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    {t('history.empty', 'No matches yet.')}
                  </td>
                </tr>
              )}
              {history.map((m) => (
                <tr key={m.id} className="hover:bg-white/20 transition-colors">
                  <td className="py-4 px-4 text-gray-600">
                    {m.round ? (roundLabel[m.round] ?? m.round) : '—'}
                  </td>
                  <td className="py-4 px-4 font-bold text-gray-700">{m.username_player1}</td>
                  <td className="py-4 px-4 text-center font-bold text-teal-600">
                    {m.score_player1 ?? '—'} – {m.score_player2 ?? '—'}
                  </td>
                  <td className="py-4 px-4 font-bold text-gray-700">{m.username_player2}</td>
                  <td className="py-4 px-4 font-medium text-emerald-600">
                    {m.username_winner ?? '—'}
                  </td>
                  <td className="py-4 px-4 text-right text-gray-500 text-sm">
                    {m.tournament_id ? `#${m.tournament_id}` : 'Free'}
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
export const HistoryListMobile = ({ history }: { history: MatchHistory[] }) => {
  const { t } = useTranslation();
  if (history.length === 0)
    return (
      <p className="text-center text-gray-500 py-10">
        {t('history.empty', 'No matches yet.')}
      </p>
    );
  return (
    <>
      {history.map((m) => (
        <div
          key={m.id}
          className="bg-white/80 backdrop-blur rounded-2xl p-4 m-4 shadow flex flex-col gap-3"
        >
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">
              {m.round ? (roundLabel[m.round] ?? m.round) : 'Free match'}
            </span>
            <span className="text-sm text-gray-500">
              {m.tournament_id ? `Tournament #${m.tournament_id}` : ''}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-700">{m.username_player1}</span>
            <span className="font-bold text-teal-600 px-3">
              {m.score_player1 ?? '—'} – {m.score_player2 ?? '—'}
            </span>
            <span className="font-bold text-gray-700">{m.username_player2}</span>
          </div>
          {m.username_winner && (
            <div className="text-sm font-medium text-emerald-600">🏆 {m.username_winner}</div>
          )}
        </div>
      ))}
    </>
  );
};
