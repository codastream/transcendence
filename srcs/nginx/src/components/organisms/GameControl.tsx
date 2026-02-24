interface GameControlProps {
  className?: string;
  onCreateLocalGame: () => void;
  loading?: boolean;
}

const GameControl = ({
  className,
  onCreateLocalGame: onCreateLocalGame,
  loading,
}: GameControlProps) => {
  return (
    <div className={`flex gap-4 ${className}`}>
      <button
        style={{ border: '3px solid red' }}
        id="create-game-btn"
        // onClick={onCreateLocalGame}
        onClick={() => {
          console.log('Button clicked!');
          onCreateLocalGame();
        }}
        disabled={loading}
        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded transition"
      >
        {loading ? 'Creating...' : 'Play local game'}
      </button>
      <button
        id="exit-btn"
        className="flex-1 bg-red-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded transition"
      >
        Exit to main page
      </button>
    </div>
  );
};
export default GameControl;
