import { createStorage } from '../../src';
import { ValidationError } from '../../src/errors/validation.error';
import { AbstractStorageProvider } from '../../src/storage-providers/abstract-storage.provider';
import { LocalStorageCollection, LocalStorageProvider } from './localstorage/localstorage.provider';

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

  test('create LocalStorageCollection', () => {

    const STORAGE_NAME = 'test_storage';
    const STORAGE_VERSION = 4;
    const COLLECTION_NAME = 'test_collection';

    const storage = createStorage(STORAGE_NAME, STORAGE_VERSION, 'localstorage');
    const collection = storage.createCollection(COLLECTION_NAME, {
      name: {type: 'string'},
      age: {type: 'number'}
    });

    expect(collection instanceof LocalStorageCollection).toBe(true);
    expect(collection.name).toBe(COLLECTION_NAME);
    expect(collection.storage.storageName).toBe(STORAGE_NAME);
    expect(collection.storage.storageVersion).toBe(STORAGE_VERSION);
  });

  test('LocalStorageCollection create with default options', async () => {
    const storage = createStorage('test_storage', 5, ['localstorage']);

    const usersCollection = storage.createCollection('users', {
      name: {
        type: 'string',
        required: true
      },
      age: {
        type: 'number',
        default: 20,
        index: true
      }
    });

    expect.assertions(8);

    usersCollection.create({name: 'Ivan', age: 42}).then((createdItem) => {
      expect(createdItem.name).toBe('Ivan');
      expect(createdItem.age).toBe(42);
      expect(typeof(createdItem.uuid)).toBe('string');
    });

    usersCollection.create({name: 'Pavel'}).then((createdItem) => {
      expect(createdItem.name).toBe('Pavel');
      expect(createdItem.age).toBe(20);
      expect(typeof(createdItem.uuid)).toBe('string');
    });

    usersCollection.create({age: 16}).catch((error) => {
      expect(error.fieldName).toBe('name');
    });

    usersCollection.create({name: '', age: 16}).catch((error) => {
      expect(error.name).toBe('ValidationError');
    });
    jest.runAllTimers();
  });

  test('LocalStorageCollection create with custom id', async () => {
    const storage = createStorage('test_storage', 6, ['localstorage'], {idFieldName: '_id', idFieldType: 'objectid'});

    const usersCollection = storage.createCollection('users', {
      name: {
        type: 'string'
      },
      age: {
        type: 'number'
      }
    });

    expect.assertions(3);

    usersCollection.create({}).then((createdItem) => {
      expect(typeof(createdItem._id)).toBe('string');
      expect(typeof(createdItem.uuid)).toBe('undefined');
      expect(createdItem._id.length).toBe(24);
    });
    jest.runAllTimers();
  });

  test('LocalStorageCollection select all from collection', () => {

  });
});
