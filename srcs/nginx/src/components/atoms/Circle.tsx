interface CircleProps {
  children: React.ReactNode;
  className?: string;
  size?: number;
}

const Circle = ({ children, className = '', size = 120 }: CircleProps) => {
  return (
    <div
      style={
        {
          '--circle-size': `${size}vh`,
        } as React.CSSProperties
      }
      className={`
      bg-white/80
      shadow-2xl
      z-0
      flex
      items-center
      justify-center
      transition-all duration-900 ease-in-out
      relative
      w-[95vw]
      h-[80vh]
      max-h-[90vh]
      rounded-3xl
      mx-auto
      text-gray-700
      sm:mt-2
      lg:absolute
      lg:top-1/2
      lg:left-1/2
      lg:-translate-x-1/2
      lg:-translate-y-1/2
      lg:h-(--circle-size) 
      lg:w-(--circle-size) 
      lg:max-h-(--circle-size)
      lg:max-w-(--circle-size)
      lg:rounded-full
      ${className}`}
    >
      <div className="relative z-10 w-full max-w-4xl px-2 md:px-6 md:max-h-[80vh] max-h-[70vh] overflow-y-auto no-scrollbar pt-8 lg:mt-16 flex flex-col items-center text-center">
        {children}
      </div>
    </div>
  );
};

export default Circle;
