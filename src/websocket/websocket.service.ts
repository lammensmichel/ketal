import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { Room } from 'src/models/room.model';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  constructor(private socket: Socket) {}

  getRooms(): Observable<Room[]> {
    return this.socket.fromEvent('rooms');
  }

  createRoom(room: Room) {
    this.socket.emit('create-room', room);
  }

  joinRoom(room: Room) {
    this.socket.emit('join-room', room);
  }

  deleteRoom(room: Room) {
    this.socket.emit('delete-room', room);
  }
}
