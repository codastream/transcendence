import { MatchStatus } from '../../types/types';

interface MatchNodeProps {
  label: string;
  status: MatchStatus;
  highlight?: boolean;
  onStart?: () => void;
}

export function MatchNode({ label, status, highlight = false, onStart }: MatchNodeProps) {
  const canStart = status === 'ready';

  return (
    <div
      className={`
        flex items-center gap-4 px-6 py-3 rounded-full
        text-sm font-medium font-quantico
        backdrop-blur border border-cyan-200
        ${highlight ? 'bg-cyan-500 text-white shadow-lg' : 'bg-white/70 text-gray-600'}
      `}
    >
      {/* Label */}
      <span>{label}</span>
    </div>
  );
}
