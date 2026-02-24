interface GameControlProps {
  className?: string;
  onCreateLocalGame: () => void;
  onStartGame: () => void;
  // onExitGame: () => void;
  loading?: boolean;
}

const GameControl = ({
  className,
  onCreateLocalGame: onCreateLocalGame,
  onStartGame: onStartGame,
  // onExitGame: onExitGame,
  loading,
}: GameControlProps) => {
  return (
    <div className={`flex gap-4 ${className}`}>
      <button
        id="create-game-btn"
        onClick={() => {
          onCreateLocalGame();
        }}
        disabled={loading}
        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded transition"
      >
        {loading ? 'Creating...' : 'Create new GAME (sessions)'}
      </button>

      <button
        style={{ border: '3px solid red' }}
        id="start-game-btn"
        // onClick={onCreateLocalGame}
        onClick={() => {
          onStartGame();
        }}
        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded transition"
      >
        Start GAME (ONLY IF IN SESSION)
      </button>
      <button
        id="exit-btn"
        onClick={() => {
          // onExitGame();
          console.log('exit');
        }}
        className="flex-1 bg-red-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded transition"
      >
        Exit to main page
      </button>
    </div>
  );
};
export default GameControl;
