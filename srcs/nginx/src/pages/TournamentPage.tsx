import { useTranslation } from 'react-i18next';
import { TournamentBracket } from '../components/molecules/TournamentBracket';
import { Player } from '../types/types';
import { useState, useEffect } from 'react';
import { PlayerDTO } from '@transcendence/core';
import api from '../api/api-client';
import { useParams } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

/* The principle of the tournament page:
 * The creator is displayed first, then the players join sequentially.
 * The three other slots are tournament participation slots;
 * they are initially initialized by this function,
 * and the "waiting" status corresponds to that slot.
 */
export function createWaitingPlayer(label: string, slotidx: 1 | 2 | 3 | 4): Player {
  return {
    id: 'waiting-' + slotidx,
    name: label,
    avatar: null,
    slot: slotidx,
    online: false,
    status: 'waiting',
  };
}

/* the mappers always asign connected to the player joinning
 * a tournament
 */
async function mapPlayerDTO(dto: PlayerDTO): Promise<Player> {
  return {
    id: dto.player_id.toString(),
    name: dto.username,
    avatar: dto.avatar,
    slot: dto.slot,
    online: true,
    status: 'connected',
  };
}

export default function TournamentPage() {
  const { t } = useTranslation();

  function fillSlotPlayer(players: Player[]): [Player, Player, Player, Player] {
    const slots: Player[] = new Array(4).fill(null);
    const nbSlots = 4;
    players.forEach((p) => {
      const slotIndex = p.slot - 1;
      slots[slotIndex] = p;
    });
    for (let i = 0; i < nbSlots; i++) {
      if (!slots[i]) {
        slots[i] = createWaitingPlayer(t('game.waiting'), (i + 1) as 1 | 2 | 3 | 4);
      }
    }

    return slots as [Player, Player, Player, Player];
  }

  const { id } = useParams<{ id: string }>();
  const [players, setPlayers] = useState<Player[]>([]);
  useEffect(() => {
    if (!id) return;

    const fetchPlayers = async () => {
      try {
        const { data } = await api.get<PlayerDTO[]>(`/game/tournaments/${id}`);
        const playersMapped = await Promise.all(data.map((dto) => mapPlayerDTO(dto)));
        setPlayers(playersMapped);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlayers();
    // refresh the page to show in realtime the users who joining the tournament
    const interval = setInterval(fetchPlayers, 20000);
    return () => clearInterval(interval);
  }, [id]);

  if (!id) {
    return <Navigate to="/tournaments" replace />;
  }

  return <TournamentBracket players={fillSlotPlayer(players)} tournamentId={id} />;
}
