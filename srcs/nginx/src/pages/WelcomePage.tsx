import { NavBar } from '../components/molecules/NavBar';
import Halo from '../components/atoms/Halo';
import Background from '../components/atoms/Background';
import { useState } from 'react';

const colors = {
  start: '#00ff9f',
  end: '#0088ff',
};

/**
 * WelcomePage — Page d'authentification (login / register).
 *
 * Protégée par PublicRoute : seuls les utilisateurs NON connectés y accèdent.
 * Le contenu "game menu" (anciennement affiché ici quand auth) a été extrait
 * vers HomePage pour respecter le Single Responsibility Principle.
 */
export const WelcomePage = () => {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="w-full h-full relative">
      <Background
        grainIntensity={4}
        baseFrequency={0.28}
        colorStart={colors.start}
        colorEnd={colors.end}
      >
        <NavBar />
        <Halo
          size={80}
          isRegister={isRegister}
          onToggleForm={() => setIsRegister(!isRegister)}
          className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </Background>
    </div>
  );
};
