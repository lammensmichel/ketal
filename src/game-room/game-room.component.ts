import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Room } from 'src/models/room.model';
import { WebsocketService } from 'src/websocket/websocket.service';
import { v4 as uuidv4 } from 'uuid';
import { FormBuilder, FormGroup, NgModel, Validators } from '@angular/forms';

@Component({
  selector: 'app-game-room',
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.scss'],
})
export class GameRoomComponent implements OnInit {
  rooms: Room[] = [];
  roomForm: FormGroup;

  constructor(
    private websocketService: WebsocketService,
    private formBuilder: FormBuilder
  ) {
    this.roomForm = this.formBuilder.group({
      newRoomName: ['', Validators.required],
      newRoomDescription: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.websocketService.getRooms().subscribe((rooms: Room[]) => {
      this.rooms = rooms;
    });
  }

  createRoom() {
    const newRoomName = this.roomForm.value.newRoomName;
    const newRoomDescription = this.roomForm.value.newRoomDescription;
    let room = {
      name: newRoomName,
      description: newRoomDescription,
      id: uuidv4(),
    };
    this.websocketService.createRoom(room);
  }

  joinRoom(room: Room) {
    this.websocketService.joinRoom(room);
  }

  deleteRoom(room: Room) {
    this.websocketService.deleteRoom(room);
  }
}
