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
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="min-w-full text-sm text-slate-200">
        <thead className="bg-teal-800/40 text-slate-300 uppercase text-xs tracking-wider">
          <tr>
            <th className="px-4 py-3 text-left">Round</th>
            <th className="px-4 py-3 text-center">Player 1</th>
            <th className="px-4 py-3 text-center">Score</th>
            <th className="px-4 py-3 text-center">Player 2</th>
            <th className="px-4 py-3 text-center">Winner</th>
            <th className="px-4 py-3 text-right">Tournament</th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-sm">
                {t('history.empty', 'No matches yet.')}
              </td>
            </tr>
          )}
          {history.map((m, i) => (
            <tr
              key={m.id}
              className={`border-t border-slate-700/50 hover:bg-teal-800/10 transition-colors ${
                i % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-800/40'
              }`}
            >
              <td className="px-4 py-3 text-slate-300">
                {m.round ? (roundLabel[m.round] ?? m.round) : '—'}
              </td>
              <td className="px-4 py-3 text-center font-medium text-slate-100">
                {m.username_player1}
              </td>
              <td className="px-4 py-3 text-center font-bold text-teal-300">
                {m.score_player1 ?? '—'} – {m.score_player2 ?? '—'}
              </td>
              <td className="px-4 py-3 text-center font-medium text-slate-100">
                {m.username_player2}
              </td>
              <td className="px-4 py-3 text-center text-teal-300 font-semibold">
                {m.username_winner ?? '—'}
              </td>
              <td className="px-4 py-3 text-right text-slate-400 text-xs">
                {m.tournament_id ? `#${m.tournament_id}` : 'Free'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Mobile cards ───────────────────────────────────────────────────────────
export const HistoryListMobile = ({ history }: { history: MatchHistory[] }) => {
  const { t } = useTranslation();
  if (history.length === 0)
    return (
      <p className="text-slate-400 text-sm">{t('history.empty', 'No matches yet.')}</p>
    );
  return (
    <>
      {history.map((m) => (
        <div
          key={m.id}
          className="bg-slate-800/60 rounded-lg border border-slate-700 p-4 space-y-2"
        >
          <div className="flex justify-between text-xs text-slate-400">
            <span>{m.round ? (roundLabel[m.round] ?? m.round) : 'Free match'}</span>
            <span>{m.tournament_id ? `Tournament #${m.tournament_id}` : ''}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-100 font-medium">{m.username_player1}</span>
            <span className="text-teal-300 font-bold px-3">
              {m.score_player1 ?? '—'} – {m.score_player2 ?? '—'}
            </span>
            <span className="text-slate-100 font-medium">{m.username_player2}</span>
          </div>
          {m.username_winner && (
            <div className="text-xs text-teal-400">🏆 {m.username_winner}</div>
          )}
        </div>
      ))}
    </>
  );
};
