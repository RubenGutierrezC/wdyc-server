import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { nanoid } from 'nanoid';
import { Server, Socket } from 'socket.io';
import {
  CreateRoomPayload,
  CreateRoomResponse,
  GetRoomInfoResponse,
  GetRoomPlayersPayload,
  GetWaitingRoomInfoResponse,
  JoinRoomPayload,
  JoinRoomResponse,
  SocketResponse,
} from './dto/gateway-dto';
import { GameService } from './game.service';
import { Judge, Room } from './types';
import { MemeService } from '../meme/meme.service';
import { PhraseToAnswerService } from '../phrase-to-answer/phrase-to-answer.service';
import {
  handleSocketResponse,
  getTotalCardsToPlayers,
  fillCards,
} from './game.utils';

@WebSocketGateway({ cors: true })
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger: Logger = new Logger('GameGateway');

  constructor(
    private readonly redisService: GameService,
    private readonly memeService: MemeService,
    private readonly phraseToAnswerService: PhraseToAnswerService,
  ) {}

  // overrides
  afterInit() {
    this.logger.log('Init sockets');
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('create-room')
  async handleCreateRoom(
    client: Socket,
    payload: CreateRoomPayload,
  ): Promise<SocketResponse<CreateRoomResponse>> {
    try {
      const { username } = payload;

      const roomCode = nanoid(6);

      await this.redisService.createRoom({
        roomCode,
        username,
        socketId: client.id,
      });

      client.join(roomCode);

      return handleSocketResponse({
        data: {
          username,
          roomCode,
        },
      });
    } catch (error) {
      this.logger.error(error);

      return handleSocketResponse({
        message: 'server error',
        error: true,
      });
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    client: Socket,
    payload: JoinRoomPayload,
  ): Promise<SocketResponse<JoinRoomResponse>> {
    try {
      const { roomCode, username } = payload;

      const room = await this.redisService.getRoomByKey(roomCode);

      if (!room) {
        return handleSocketResponse({
          message: "Room doesn't exist",
          error: true,
        });
      }

      const decodedRoom: Room = JSON.parse(room);

      if (decodedRoom.isStarted) {
        return handleSocketResponse({
          message: 'Room already started',
          error: true,
        });
      }

      await this.redisService.joinRoom({
        username,
        roomCode,
        room,
        socketId: client.id,
      });

      client.in(roomCode).emit('join-player', { username });

      client.join(roomCode);

      return handleSocketResponse({
        message: 'ok',
        data: {
          username,
          roomCode,
        },
      });
    } catch (error) {
      this.logger.error(error);
      return handleSocketResponse({
        message: 'server error',
        error: true,
      });
    }
  }

  @SubscribeMessage('get-waiting-room-info')
  async handleGetWaitingRoomInfo(
    _client: Server,
    payload: GetRoomPlayersPayload,
  ): Promise<SocketResponse<GetWaitingRoomInfoResponse>> {
    try {
      const { roomCode, username } = payload;

      const room = await this.redisService.getRoomByKey(roomCode);

      if (!room) {
        return handleSocketResponse({
          message: "Room doesn't exist",
          error: true,
        });
      }

      const decodedRoom: Room = JSON.parse(room);

      const isUserInGame = decodedRoom.players.some(
        (p) => p.username === username,
      );

      if (!isUserInGame) {
        return handleSocketResponse({
          message: 'Invalid room',
          error: true,
        });
      }

      const isRoomCreator = decodedRoom.roomCreator === username;

      const usernamePlayers = decodedRoom.players.map((p) => ({
        username: p.username,
      }));

      return handleSocketResponse({
        message: 'ok',
        data: {
          isRoomCreator,
          players: usernamePlayers,
        },
      });
    } catch (error) {
      this.logger.error(error);
      return handleSocketResponse({
        message: 'server error',
        error: true,
      });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(client: Server, payload: any) {
    try {
      const { roomCode, username } = payload;

      const room = await this.redisService.getRoomByKey(roomCode);

      if (!room) {
        return handleSocketResponse({
          message: 'room not found',
          error: true,
        });
      }

      const decodedRoom: Room = JSON.parse(room);

      const playerIndex = decodedRoom.players.findIndex(
        (player) => player.username === username,
      );

      if (playerIndex === -1) {
        return handleSocketResponse({
          message: 'player not found',
          error: true,
        });
      }

      const removedPlayer = decodedRoom.players.splice(
        playerIndex,
        playerIndex,
      );

      await this.redisService.updateRoom({
        roomCode,
        room: decodedRoom,
      });

      this.server.in(roomCode).emit('player-leaves', {
        username: removedPlayer[0].username,
      });

      return handleSocketResponse({
        message: 'ok',
      });
    } catch (error) {
      this.logger.error(error);
      return handleSocketResponse({
        message: 'server error',
        error: true,
      });
    }
  }

  @SubscribeMessage('start-game')
  async handleStartGame(
    client: Socket,
    payload: any,
  ): Promise<SocketResponse<null>> {
    try {
      const { roomCode } = payload;

      const room = await this.redisService.getRoomByKey(roomCode);

      if (!room) {
        return handleSocketResponse({
          message: 'room not found',
          error: true,
        });
      }

      let decodedRoom: Room = JSON.parse(room);

      const playerSocketId = client.id;

      const players = decodedRoom.players;

      const playerInfoIndex = decodedRoom.players.findIndex(
        (p) => p.socketId === playerSocketId,
      );

      if (players[playerInfoIndex]?.username !== decodedRoom.roomCreator) {
        return handleSocketResponse({
          message: `you can\'t start the game`,
          error: true,
        });
      }

      const { totalJudgeCards, totalPlayersCards } = getTotalCardsToPlayers({
        rounds: 5,
        players: players.length,
        cardsPerPlayer: 7,
      });

      // load cards to judge
      const memes = await this.memeService.getRandomBySize(totalJudgeCards);
      const judgeCards = memes.map((m) => ({
        url: m.url,
        imageOrientation: m.imageOrientation,
      }));

      // load card to players
      const phrases = await this.phraseToAnswerService.getRandomBySize(
        totalPlayersCards,
      );
      const playerCards = phrases.map((p) => p.phrase);

      // get random judge
      const randomPlayerIndex = Math.floor(
        Math.random() * decodedRoom.players.length,
      );

      const judge: Judge = {
        card: judgeCards[0],
        username: decodedRoom.players[randomPlayerIndex].username,
        receivedCards: [],
      };

      const { filledCards, needRefill } = fillCards({
        totalPlayersCards,
        playerCards,
      });

      const copyFilledCards = [...filledCards];
      // set players cards
      decodedRoom.players.forEach((player) => {
        let totalCards = 0;
        while (totalCards < 7) {
          const randomCardIndex = Math.floor(
            Math.random() * filledCards.length,
          );

          if (!player.cards.some((c) => c === filledCards[randomCardIndex])) {
            const card = filledCards.splice(randomCardIndex, 1)[0];

            player.cards.push(card);
            totalCards++;
          }
        }
      });

      decodedRoom = {
        ...decodedRoom,
        isStarted: true,
        judge,
        playerCards: needRefill ? copyFilledCards : filledCards,
        judgeCards,
      };

      // modify game
      await this.redisService.updateRoom({ roomCode, room: decodedRoom });

      this.server.in(roomCode).emit('move-to-game', null);

      return handleSocketResponse({
        message: 'ok',
        data: null,
      });
    } catch (error) {
      this.logger.error(error);
      return handleSocketResponse({
        message: 'server error',
        error: true,
      });
    }
  }

  @SubscribeMessage('get-room-info')
  async handleGetRoomInfo(
    _client: Socket,
    payload: any,
  ): Promise<SocketResponse<GetRoomInfoResponse>> {
    try {
      const { roomCode, username } = payload;

      const room = await this.redisService.getRoomByKey(roomCode);

      if (!room) {
        return handleSocketResponse({
          message: 'room not found',
          error: true,
        });
      }

      const decodedRoom: Room = JSON.parse(room);

      const playerIndex = decodedRoom.players.findIndex(
        (player) => player.username === username,
      );

      if (playerIndex === -1) {
        return handleSocketResponse({
          message: 'player not found',
          error: true,
        });
      }

      const players = decodedRoom.players.map((player) => ({
        username: player.username,
        numberOfWins: player.numberOfWins,
      }));

      const judge = {
        username: decodedRoom.judge?.username,
        card: decodedRoom.judge?.card,
      };

      const cardsToSelect = decodedRoom.players[playerIndex].cards;

      const isJudge = judge.username === username;

      const receivedCards = isJudge ? decodedRoom.judge.receivedCards : [];
      const waitingForJudge =
        decodedRoom.judge.receivedCards.length ===
        decodedRoom.players.length - 1;
      const round = decodedRoom.round;

      return handleSocketResponse({
        message: 'ok',
        data: {
          players,
          cardsToSelect,
          judge,
          playerCards: receivedCards,
          waitingForJudge,
          round,
        },
      });
    } catch (error) {
      this.logger.error(error);
      return handleSocketResponse({
        message: 'server error',
        error: true,
      });
    }
  }

  @SubscribeMessage('set-card')
  async handleSetCard(
    client: Socket,
    payload: any,
  ): Promise<SocketResponse<null>> {
    try {
      const { roomCode, username, card } = payload;
      const room = await this.redisService.getRoomByKey(roomCode);

      if (!room) {
        return handleSocketResponse({
          message: 'room not found',
          error: true,
        });
      }

      const decodedRoom: Room = JSON.parse(room);

      const userIsJudge = decodedRoom.judge.username === username;

      if (userIsJudge) {
        return handleSocketResponse({
          message: 'you are the judge',
          error: true,
        });
      }

      const userAlreadyPlay = decodedRoom.judge.receivedCards.some(
        (p) => p.username === username,
      );

      if (userAlreadyPlay) {
        return {
          message: 'you already play',
          error: true,
        };
      }

      client.broadcast.to(roomCode).emit('player-set-card', username);

      decodedRoom.judge.receivedCards.push({
        username,
        card,
      });

      const isRoundOver =
        decodedRoom.judge.receivedCards.length ===
        decodedRoom.players.length - 1;

      if (isRoundOver) {
        // send socket to all partcipants, the judge have to take the winner
        this.server.to(roomCode).emit('all-players-ready');

        const judgeIndex = decodedRoom.players.findIndex(
          (p) => p.username === decodedRoom.judge.username,
        );

        if (judgeIndex > -1) {
          const judgeSocket = decodedRoom.players[judgeIndex].socketId;
          client
            .to(judgeSocket)
            .emit('select-judge-card', decodedRoom.judge.receivedCards);
        }
      }

      await this.redisService.updateRoom({
        roomCode,
        room: decodedRoom,
      });

      return handleSocketResponse({
        message: 'ok',
      });
    } catch (error) {
      this.logger.error(error);
      return handleSocketResponse({
        message: 'server error',
        error: true,
      });
    }
  }

  @SubscribeMessage('set-winner-card')
  async handleSetWinnerCard(
    client: Socket,
    payload: any,
  ): Promise<SocketResponse<any>> {
    try {
      const { roomCode, username, card } = payload;
      const room = await this.redisService.getRoomByKey(roomCode);

      if (!room) {
        return handleSocketResponse({
          message: 'room not found',
          error: true,
        });
      }

      const decodedRoom: Room = JSON.parse(room);

      const userIsJudge = decodedRoom.judge.username === username;

      if (!userIsJudge) {
        return handleSocketResponse({
          message: 'you are not the judge',
          error: true,
        });
      }

      const winnerPlayer = card.username;

      const winnerPlayerIndex = decodedRoom.players.findIndex(
        (p) => p.username === card.username,
      );

      this.server.to(roomCode).emit('winner-card', winnerPlayer);

      decodedRoom.players[winnerPlayerIndex].numberOfWins += 1;
      decodedRoom.round += 1;

      if (decodedRoom.round > 5) {
        this.logger.debug('*** GAME ENDED ***');
        // winner
        const maxWins = Math.max(
          ...decodedRoom.players.map((p) => p.numberOfWins),
        );
        const index = decodedRoom.players.findIndex(
          (p) => p.numberOfWins === maxWins,
        );
        decodedRoom.winner = decodedRoom.players[index].username;

        client.broadcast.to(roomCode).emit('end-game', winnerPlayer);
        client.emit('end-game', winnerPlayer);

        this.redisService.deleteRoom(roomCode);

        return handleSocketResponse({
          message: 'ok',
        });
      }

      // set new judge
      const judgeIndex = decodedRoom.players.findIndex(
        (p) => p.username === decodedRoom.judge.username,
      );

      const nextJudgeIndex =
        judgeIndex + 1 === decodedRoom.players.length ? 0 : judgeIndex + 1;

      decodedRoom.judgeCards.shift();

      const newJudge: Judge = {
        card: decodedRoom.judgeCards[0],
        receivedCards: [],
        username: decodedRoom.players[nextJudgeIndex].username,
      };

      const oldJudge = decodedRoom.judge;

      decodedRoom.judge = newJudge;

      for (const [index, player] of decodedRoom.players.entries()) {
        if (player.username !== oldJudge.username) {
          let cardSetted = false;

          while (!cardSetted) {
            const randomCardIndex = Math.floor(
              Math.random() * decodedRoom.playerCards.length,
            );

            if (
              !player.cards.some(
                (c) => c === decodedRoom.playerCards[randomCardIndex],
              )
            ) {
              const card = decodedRoom.playerCards.splice(
                randomCardIndex,
                1,
              )[0];

              decodedRoom.players[index].cards.push(card);
              client.in(player.socketId).emit('new-card', {
                card,
              });
              cardSetted = true;
            }
          }
        }
      }

      await this.redisService.updateRoom({
        roomCode,
        room: decodedRoom,
      });

      client.in(roomCode).emit('next-round', {
        judge: {
          username: decodedRoom.judge.username,
          card: decodedRoom.judge.card,
        },
      });

      client.emit('next-round', {
        judge: {
          username: decodedRoom.judge.username,
          card: decodedRoom.judge.card,
        },
      });

      return handleSocketResponse({
        message: 'ok',
      });
    } catch (error) {
      this.logger.error(error);
      return handleSocketResponse({
        message: 'server error',
        error: true,
      });
    }
  }

  @SubscribeMessage('reconnect')
  async handleReconnect(
    _client: Socket,
    payload: any,
  ): Promise<SocketResponse<any>> {
    try {
      const { username, roomCode } = payload;

      const room = await this.redisService.getRoomByKey(roomCode);

      if (!room) {
        return handleSocketResponse({
          message: 'ok',
          data: {
            room: null,
          },
        });
      }

      const decodedRoom: Room = JSON.parse(room);

      const playerIndex = decodedRoom.players.findIndex(
        (player) => player.username === username,
      );
      const isPlayerInRoom = playerIndex > -1;

      if (!isPlayerInRoom) {
        return handleSocketResponse({
          message: 'ok',
          data: {
            room: null,
          },
        });
      }

      return handleSocketResponse({
        message: 'ok',
        data: {
          room: {
            isStarted: decodedRoom.isStarted,
          },
        },
      });
    } catch (error) {
      this.logger.error(error);
      return handleSocketResponse({
        message: 'server error',
        error: true,
      });
    }
  }
}
