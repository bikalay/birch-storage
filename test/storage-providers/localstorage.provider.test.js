import { createStorage } from '../../src';
import { AbstractStorageProvider } from '../../src/storage-providers/abstract-storage.provider';
import { LocalStorageProvider } from '../../src/storage-providers/localstorage/localstorage.provider';

jest.useFakeTimers();

describe('LocalStorageProvider', () => {

  beforeEach(() => {
    // eslint-disable-next-line no-empty-function
    global.Storage = global.Storage ? global.Storage : function () {
    };
  });

  test('can\'t create LocalStorageProvider', () => {
    global.Storage = undefined;
    const storage = createStorage('test_storage', 1, 'localstorage');
    expect(storage).toBe(null);
  });

  test('create LocalStorageProvider by one storage type', () => {
    const storage = createStorage('test_storage', 2, 'localstorage');
    expect(storage instanceof AbstractStorageProvider).toBe(true);
    expect(storage instanceof LocalStorageProvider).toBe(true);
  });

  test('create LocalStorageProvider by one storage types array', () => {
    const storage = createStorage('test_storage', 3, ['localstorage']);
    expect(storage instanceof AbstractStorageProvider).toBe(true);
    expect(storage instanceof LocalStorageProvider).toBe(true);
  });
});



