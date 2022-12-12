import { Room } from '../types';

export interface CreateRoomServiceProps {
  username: string;
  roomCode: string;
  socketId: string;
}

export interface JoinRoomServiceProps {
  username: string;
  roomCode: string;
  room: string;
  socketId: string;
}

export interface GetPlayersProps {
  roomCode: string;
}

export interface UpdateRoomServiceProps {
  roomCode: string;
  room: Room;
}
