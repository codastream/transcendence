import { useState, useEffect } from 'react';
import {
  MatchHistory,
  HistoryTableDesktop,
  HistoryListMobile,
} from '../components/atoms/MatchHistory';
import api from '../api/api-client';

export const HistoryPage = () => {
  const [history, setHistory] = useState<MatchHistory[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get<MatchHistory[]>('/game/history');
        setHistory(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, []);

  return (
    <>
      <div className="hidden md:block w-full">
        <HistoryTableDesktop history={history} />
      </div>
      <div className="md:hidden w-full">
        <HistoryListMobile history={history} />
      </div>
    </>
  );
};
