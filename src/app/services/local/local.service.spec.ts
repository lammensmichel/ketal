import { TestBed } from '@angular/core/testing';

import { LocalService } from './local.service';

describe('LocalService', () => {
  let service: LocalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalService);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('saveData', () => {
    it('should save data to localStorage', () => {
      const setItemSpy = spyOn(Storage.prototype, 'setItem');

      service.saveData('testKey', 'testValue');

      expect(setItemSpy).toHaveBeenCalledWith('testKey', 'testValue');
    });

    it('should save string value correctly', () => {
      service.saveData('myKey', 'myValue');

      expect(localStorage.getItem('myKey')).toBe('myValue');
    });

    it('should overwrite existing value with same key', () => {
      service.saveData('key', 'value1');
      service.saveData('key', 'value2');

      expect(localStorage.getItem('key')).toBe('value2');
    });

    it('should handle empty string value', () => {
      service.saveData('emptyKey', '');

      expect(localStorage.getItem('emptyKey')).toBe('');
    });

    it('should handle JSON stringified objects', () => {
      const obj = { name: 'test', value: 123 };
      const jsonString = JSON.stringify(obj);

      service.saveData('jsonKey', jsonString);

      expect(localStorage.getItem('jsonKey')).toBe(jsonString);
    });
  });

  describe('getData', () => {
    it('should retrieve data from localStorage', () => {
      localStorage.setItem('retrieveKey', 'retrieveValue');
      const getItemSpy = spyOn(Storage.prototype, 'getItem').and.callThrough();

      const result = service.getData('retrieveKey');

      expect(getItemSpy).toHaveBeenCalledWith('retrieveKey');
      expect(result).toBe('retrieveValue');
    });

    it('should return null for non-existent key', () => {
      const result = service.getData('nonExistentKey');

      expect(result).toBeNull();
    });

    it('should return saved value', () => {
      service.saveData('savedKey', 'savedValue');

      const result = service.getData('savedKey');

      expect(result).toBe('savedValue');
    });

    it('should return empty string when empty string was saved', () => {
      service.saveData('emptyKey', '');

      const result = service.getData('emptyKey');

      expect(result).toBe('');
    });
  });

  describe('removeData', () => {
    it('should remove data from localStorage', () => {
      const removeItemSpy = spyOn(Storage.prototype, 'removeItem');

      service.removeData('keyToRemove');

      expect(removeItemSpy).toHaveBeenCalledWith('keyToRemove');
    });

    it('should remove existing item', () => {
      service.saveData('itemToDelete', 'value');
      expect(localStorage.getItem('itemToDelete')).toBe('value');

      service.removeData('itemToDelete');

      expect(localStorage.getItem('itemToDelete')).toBeNull();
    });

    it('should not throw when removing non-existent key', () => {
      expect(() => {
        service.removeData('nonExistentKey');
      }).not.toThrow();
    });

    it('should only remove specified key', () => {
      service.saveData('key1', 'value1');
      service.saveData('key2', 'value2');

      service.removeData('key1');

      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBe('value2');
    });
  });

  describe('clearData', () => {
    it('should clear all data from localStorage', () => {
      const clearSpy = spyOn(Storage.prototype, 'clear');

      service.clearData();

      expect(clearSpy).toHaveBeenCalled();
    });

    it('should remove all stored items', () => {
      service.saveData('key1', 'value1');
      service.saveData('key2', 'value2');
      service.saveData('key3', 'value3');

      service.clearData();

      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBeNull();
      expect(localStorage.getItem('key3')).toBeNull();
      expect(localStorage.length).toBe(0);
    });

    it('should not throw when localStorage is already empty', () => {
      expect(() => {
        service.clearData();
      }).not.toThrow();
    });
  });
});
