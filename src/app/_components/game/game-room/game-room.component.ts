import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntil } from 'rxjs';
import { SafeUnsubscribe } from 'src/app/_shared/_helpers/safe-unsubscribe.helper';
import { Room } from 'src/app/_shared/_models/room.model';
import { WebsocketService } from 'src/app/services/websocket/websocket.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-game-room',
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgFor, ReactiveFormsModule, TranslateModule],
})
export class GameRoomComponent extends SafeUnsubscribe implements OnInit {
  private websocketService = inject(WebsocketService);
  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  rooms: Room[] = [];
  roomForm: FormGroup;

  constructor() {
    super();

    this.roomForm = this.formBuilder.group({
      newRoomName: ['', Validators.required],
      newRoomDescription: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.websocketService
      .getRooms()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((rooms: Room[]) => {
        this.rooms = rooms;
        this.cdr.markForCheck();
      });
  }

  createRoom() {
    const newRoomName = this.roomForm.value.newRoomName;
    const newRoomDescription = this.roomForm.value.newRoomDescription;
    const room = {
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
