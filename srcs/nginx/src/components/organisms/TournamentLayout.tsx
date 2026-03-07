import { Outlet } from 'react-router-dom';
import Background from '../atoms/Background';
import { NavBar } from '../molecules/NavBar';
import { Footer } from '../molecules/Footer';
import Scrollable from '../atoms/Scrollable';

const colors = {
  start: '#00ff9f',
  end: '#0088ff',
};

/*This component is the architecture of all tournament pages.*/
export default function TournamentLayout() {
  return (
    <div className={`w-full relative flex flex-col h-screen`}>
      <Background
        grainIntensity={4}
        baseFrequency={0.28}
        colorStart={colors.start}
        colorEnd={colors.end}
      >
        {
          <div className="sticky top-0 z-20">
            <NavBar></NavBar>
          </div>
        }
        <Scrollable disableMaxWidth>
          <Outlet />
        </Scrollable>
        <Footer className="absolute bottom-0 mt-6 w-full" />
      </Background>
    </div>
  );
}
