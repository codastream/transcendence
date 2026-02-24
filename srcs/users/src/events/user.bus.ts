// src/events/user.bus.ts
import { EventEmitter } from 'events';

// On définit un singleton pour le bus
export const userBus = new EventEmitter();
