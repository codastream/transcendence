interface LoaderProps {
  size?: number;
  message?: string;
}

const Loader = ({ size = 24, message }: LoaderProps) => {
  const containerStyle = { width: size, height: size };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={containerStyle}>
        <div className="absolute inset-0 rounded-full border-4 border-cyan-200 border-t-transparent animate-spin" />
        <div className="absolute inset-[25%] rounded-full bg-cyan-400 animate-pulse" />
        <div className="absolute inset-0 rounded-full blur-xl bg-cyan-200 opacity-60" />
      </div>
      {message && <span className="animate-pulse">{message}</span>}
    </div>
  );
};

export default Loader;
