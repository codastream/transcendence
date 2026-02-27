import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MatchHistory,
  HistoryTableDesktop,
  HistoryListMobile,
} from '../components/atoms/MatchHistory';
// import api from '../api/api-client';

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
    <div className="flex flex-col w-full max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-6 tracking-wide uppercase">
        🕹️ {t('history.title', 'Match History')}
      </h1>
      <div className="hidden md:block w-full">
        <HistoryTableDesktop history={history} />
      </div>
      <div className="md:hidden space-y-4 w-full">
        <HistoryListMobile history={history} />
      </div>
    </div>
  );
};
