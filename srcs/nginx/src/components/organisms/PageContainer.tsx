import Background from '../atoms/Background';
import Circle from '../atoms/Circle';
import { NavBar } from '../molecules/NavBar';

interface PageProps {
  children: React.ReactNode;
}

const colors = {
  start: '#00ff9f',
  end: '#0088ff',
};

export const Page = ({ children }: PageProps) => {
  return (
    <div className="w-full h-full relative">
      <Background
        grainIntensity={8}
        baseFrequency={0.28}
        colorStart={colors.start}
        colorEnd={colors.end}
      >
        <div className="z-15 lg:absolute top-0 left-0 w-full lg-h-full">
          <NavBar></NavBar>
        </div>
        <Circle>{children}</Circle>
      </Background>
    </div>
  );
};
