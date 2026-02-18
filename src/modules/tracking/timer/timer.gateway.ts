import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService, TimerState } from '../../../prisma/redis.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TimerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private redisService: RedisService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:timer')
  async handleJoinTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { timerId: string; userId: string },
  ) {
    client.join(`timer:${data.timerId}`);
    const timer = await this.redisService.getTimer(data.timerId);
    if (timer) {
      client.emit('timer:state', timer);
    }
    return { success: true };
  }

  @SubscribeMessage('leave:timer')
  handleLeaveTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { timerId: string },
  ) {
    client.leave(`timer:${data.timerId}`);
    return { success: true };
  }

  async broadcastTimerUpdate(timer: TimerState) {
    this.server.to(`timer:${timer.id}`).emit('timer:state', timer);
  }

  async broadcastTimerComplete(timer: TimerState) {
    this.server.to(`timer:${timer.id}`).emit('timer:complete', timer);
  }
}
