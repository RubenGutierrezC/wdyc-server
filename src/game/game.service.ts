import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import {
  CreateRoomServiceProps,
  JoinRoomServiceProps,
  UpdateRoomServiceProps,
} from './dto/gameServices-dto';
import { IORedisKey } from './redis.module';
import { Room } from './types';

@Injectable()
export class GameService {
  constructor(@Inject(IORedisKey) private readonly redisClient: Redis) {}

  async getRoomByKey(key: string) {
    return await this.redisClient.get(key);
  }

  async createRoom({ roomCode, username, socketId }: CreateRoomServiceProps) {
    const room: Room = {
      roomCreator: username,
      config: {},
      round: 1,
      playerCards: [],
      judgeCards: [],
      judge: {
        card: {
          url: '',
          imageOrientation: '',
        },
        username: '',
        receivedCards: [],
      },
      winner: '',
      players: [
        {
          username,
          numberOfWins: 0,
          cards: [],
          socketId,
        },
      ],
      isStarted: false,
    };

    await this.redisClient.set(roomCode, JSON.stringify(room));
  }

  async joinRoom({ roomCode, username, room, socketId }: JoinRoomServiceProps) {
    const jsonRoom = JSON.parse(room);

    await this.redisClient.set(
      roomCode,
      JSON.stringify({
        ...jsonRoom,
        players: [
          ...jsonRoom.players,
          {
            username,
            numberOfWins: 0,
            cards: [],
            socketId,
          },
        ],
      }),
    );
  }

  async updateRoom({ roomCode, room }: UpdateRoomServiceProps) {
    await this.redisClient.set(roomCode, JSON.stringify(room));
  }

  async deleteRoom(roomCode: string) {
    await this.redisClient.del(roomCode);
  }
}
