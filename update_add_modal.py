#!/usr/bin/env python3

html = open('src/app/_components/friend/friends.component.html', 'r').read()

new_add_modal = '''  <!-- Add friend modal -->
  <ng-template #addModal>
    <div class="modal-header">
      <h4 class="modal-title">
        <fa-icon [icon]="['fas', 'user-plus']"></fa-icon>
        {{ 'friends.addFriend' | translate }}
      </h4>
      <button type="button" class="btn-close" (click)="modalRef?.close()"></button>
    </div>
    <div class="modal-body">
      <div class="friend-modal-search">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          [placeholder]="'friends.searchNickname' | translate"
          class="form-control"
          (keyup.enter)="searchUsers(searchQuery)"
        />
        <button
          (click)="searchUsers(searchQuery)"
          class="btn btn-primary mt-2"
          [disabled]="isSearching()"
        >
          @if (isSearching()) {
            <fa-icon [icon]="['fas', 'spinner']" class="fa-spin"></fa-icon>
            {{ 'friends.searching' | translate }}
          } @else {
            {{ 'friends.search' | translate }}
          }
        </button>
      </div>

      @if (isLoaded()) {
        <div class="friend-modal-results">
          @if (searchResults().length > 0) {
            <div class="search-results-list">
              @for (result of searchResults(); track result.userId) {
                <div class="search-result-item">
                  <span class="search-result-name">{{ result.name }}</span>
                  <button
                    (click)="addFriendByNickname(result.name)"
                    class="btn btn-sm btn-outline-primary"
                  >
                    <fa-icon [icon]="['fas', 'user-plus']"></fa-icon>
                    {{ 'friends.add' | translate }}
                  </button>
                </div>
              }
            </div>
          } @else if (searchQuery()) {
            <p class="no-results">{{ 'friends.noResults' | translate }}</p>
          }
        </div>
      }
    </div>
  </ng-template>'''

# Replace the addModal
old_add_modal_start = '  <!-- Add friend modal -->'
old_add_modal_end = '  </ng-template>__QR_MODAL__'

# Find the addModal section
add_modal_start = html.find(old_add_modal_start)
qr_modal_start = html.find('  <!-- QR Code modal -->')

if add_modal_start != -1 and qr_modal_start != -1:
    new_html = html[:add_modal_start] + new_add_modal + '\n\n' + html[qr_modal_start:]
    open('src/app/_components/friend/friends.component.html', 'w').write(new_html)
    print("Updated add modal")
else:
    print("Could not find modal sections")
