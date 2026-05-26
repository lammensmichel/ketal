import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalService {
  public saveData(key: string, value: string) {
    console.log('[LocalService] saveData:', key, value?.substring(0, 100));
    localStorage.setItem(key, value);
  }

  public getData(key: string) {
    return localStorage.getItem(key);
  }
  public removeData(key: string) {
    localStorage.removeItem(key);
  }

  public clearData() {
    localStorage.clear();
  }
}
