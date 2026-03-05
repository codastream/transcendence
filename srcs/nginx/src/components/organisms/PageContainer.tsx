import Background from '../atoms/Background';
import Circle from '../atoms/Circle';
import { Footer } from '../molecules/Footer';
import { NavBar } from '../molecules/NavBar';

interface PageProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  hasNavbar?: boolean;
  hasFooter?: boolean;
}

const colors = {
  start: '#00ff9f',
  end: '#0088ff',
};

export const Page = ({
  children,
  title,
  className,
  hasNavbar = true,
  hasFooter = true,
}: PageProps) => {
  return (
    <div className={`w-full h-full relative ${className}`}>
      <Background
        grainIntensity={4}
        baseFrequency={0.28}
        colorStart={colors.start}
        colorEnd={colors.end}
      >
        <div className="flex flex-col h-screen">
          {hasNavbar && (
            <div className="flex-none z-15 lg:absolute top-0 left-0 w-full lg-h-full">
              <NavBar></NavBar>
            </div>
          )}
          <div className="grow flex flex-col justify-center overflow-hidden">
            <Circle>
              {title && <h1 className="mb-6 text-gray-600 text-4xl font-quantico">{title}</h1>}
              {children}
            </Circle>
          </div>
          {hasFooter && <Footer className="flex-none z-15" />}
        </div>
      </Background>
    </div>
  );
};
