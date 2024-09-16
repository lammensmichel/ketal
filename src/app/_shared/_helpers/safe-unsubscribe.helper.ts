import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export declare abstract class SafeUnsubscribe implements OnDestroy {
    ngUnsubscribe: Subject<void>;
    alive: boolean;
    ngOnDestroy(): void;

}
//# sourceMappingURL=safe-unsubscribe.d.ts.map
