import { ReactNode } from 'react';

interface ScrollableProps {
  children: ReactNode;
}

export default function Scrollable({ children }: ScrollableProps) {
  return (
    <div className="p-1 min-h-[90vh] flex justify-center items-center">
      <div className="h-[90vh] w-80 shadow-md overflow-y-auto flex flex-col items-center gap-12 py-10 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}
