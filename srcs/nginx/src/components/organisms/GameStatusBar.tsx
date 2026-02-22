interface GameStatusBarProps {
  className?: string;
}

const GameStatusBar = ({ className = '' }: GameStatusBarProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 max-w-2xl mx-auto">
        <div className="flex justify-around text-white">
          <div className="text-center">
            <p className="text-sm text-purple-300">Player A</p>
            <p id="player1-score" className="text-3xl font-bold">
              0
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-purple-300">Game Status</p>
            <p id="game-status-text" className="text-xl font-semibold text-yellow-400">
              Ready
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-purple-300">Player B</p>
            <p id="player2-score" className="text-3xl font-bold">
              0
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur rounded-lg p-3 max-w-2xl mx-auto">
        <p className="text-gray-300 text-sm">
          Controls: <span className="text-purple-300 font-mono">W/S</span> for left paddle,{' '}
          <span className="text-purple-300 font-mono">↑/↓</span> for right paddle
        </p>
      </div>

      <div className="bg-white/5 backdrop-blur rounded-lg p-4 max-w-2xl mx-auto">
        <h3 className="text-sm font-semibold text-purple-300 mb-2">Game Log</h3>
        <div
          id="game-log"
          className="h-24 overflow-y-auto space-y-1 text-left text-sm font-mono text-gray-300"
        ></div>
      </div>
    </div>
  );
};

export default GameStatusBar;
