import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Background from '../components/atoms/Background';
import { NavBar } from '../components/molecules/NavBar';
// import api from '../api/api-client';

// ── Types ──────────────────────────────────────────────────────────────────
interface MatchHistory {
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

// ── Mock data ──────────────────────────────────────────────────────────────
const MOCK_HISTORY: MatchHistory[] = [
  {
    id: 3,
    tournament_id: 1,
    round: 'FINAL',
    score_player1: 5,
    score_player2: 4,
    winner_id: 1,
    created_at: Date.now() - 1000 * 60,
    username_player1: 'Player #1',
    username_player2: 'Player #3',
    username_winner: 'Player #1',
  },
  {
    id: 4,
    tournament_id: 1,
    round: 'LITTLE_FINAL',
    score_player1: 5,
    score_player2: 3,
    winner_id: 2,
    created_at: Date.now() - 1000 * 120,
    username_player1: 'Player #2',
    username_player2: 'Player #4',
    username_winner: 'Player #2',
  },
  {
    id: 1,
    tournament_id: 1,
    round: 'SEMI_1',
    score_player1: 5,
    score_player2: 2,
    winner_id: 1,
    created_at: Date.now() - 1000 * 300,
    username_player1: 'Player #1',
    username_player2: 'Player #2',
    username_winner: 'Player #1',
  },
  {
    id: 2,
    tournament_id: 1,
    round: 'SEMI_2',
    score_player1: 5,
    score_player2: 0,
    winner_id: 3,
    created_at: Date.now() - 1000 * 300,
    username_player1: 'Player #3',
    username_player2: 'Player #4',
    username_winner: 'Player #3',
  },
];

const roundLabel: Record<string, string> = {
  SEMI_1: 'Semi-final 1',
  SEMI_2: 'Semi-final 2',
  LITTLE_FINAL: '3rd Place',
  FINAL: 'Final',
};

const colors = { start: '#00ff9f', end: '#0088ff' };

export const HistoryPage = () => {
  const { t } = useTranslation();
  const [history] = useState<MatchHistory[]>(MOCK_HISTORY);

  // useEffect(() => {
  //   const fetchHistory = async () => {
  //     try {
  //       const { data } = await api.get<MatchHistory[]>('/game/history');
  //       setHistory(data);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };
  //   fetchHistory();
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
              🕹️ {t('history.title', 'Match History')}
            </h1>

            {history.length === 0 && (
              <p className="text-slate-400 text-sm">{t('history.empty', 'No matches yet.')}</p>
            )}

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-700">
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

            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
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
            </div>
          </div>
        </div>
      </Background>
    </div>
  );
};
