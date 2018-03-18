import { createStorage } from '../../src';
import { AbstractStorageProvider } from '../../src/storage-providers/abstract-storage.provider';
import { LocalStorageProvider } from '../../src/storage-providers/localstorage/localstorage.provider';
import { LocalStorageCollection } from '../../src/storage-providers/localstorage/localstorage.collection';

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

  test('LocalStorageCollection batch create', async () => {
    const storage = createStorage('test_storage', 6, ['localstorage']);

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

    const arr = [];
    expect.assertions(4);
    arr.push({name: 'Ivan', age: 30});
    arr.push({name: 'Igor', age: 28});
    arr.push({name: 'Petr', age: 45});
    arr.push({name: 'John', age: 20});
    usersCollection.batchCreate(arr).then(() => {
      usersCollection.find({}).then((result) => {
        expect(result.length).toBe(4);
        expect(typeof (result[0].name)).toBe('string');
        expect(typeof (result[1].age)).toBe('number');
        expect(typeof (result[2].uuid)).toBe('string');
      });
      jest.runAllTimers();
    });
    jest.runAllTimers();
  });

  test('LocalStorageCollection create with custom id', async () => {
    const storage = createStorage('test_storage', 7, ['localstorage'], {idFieldName: '_id', idFieldType: 'objectid'});

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

  test('LocalStorageCollection find all from collection', () => {
    const storage = createStorage('test_storage', 8, ['localstorage']);
    const usersCollection = storage.createCollection('users', {
      name: {
        type: 'string'
      },
      age: {
        type: 'number'
      }
    });
    const actionsArr = [];
    expect.assertions(4);
    actionsArr.push(usersCollection.create({name: 'Ivan', age: 30}));
    actionsArr.push(usersCollection.create({name: 'Igor', age: 28}));
    actionsArr.push(usersCollection.create({name: 'Petr', age: 45}));
    actionsArr.push(usersCollection.create({name: 'John', age: 20}));
    Promise.all(actionsArr).then(() => {
      usersCollection.find({}).then((result) => {
        expect(result.length).toBe(4);
        expect(typeof (result[0].name)).toBe('string');
        expect(typeof (result[1].age)).toBe('number');
        expect(typeof (result[2].uuid)).toBe('string');
      });
      jest.runAllTimers();
    });
    jest.runAllTimers();
  });

  test('LocalStorageCollection find by index', () => {
    const storage = createStorage('test_storage', 9, ['localstorage']);
    const usersCollection = storage.createCollection('users', {
      name: {
        type: 'string',
        index: true,
      },
      age: {
        type: 'number',
        index: true,
      }
    });
    const actionsArr = [];
    expect.assertions(7);
    actionsArr.push(usersCollection.create({name: 'Ivan', age: 30}));
    actionsArr.push(usersCollection.create({name: 'Igor', age: 28}));
    actionsArr.push(usersCollection.create({name: 'Petr', age: 45}));
    actionsArr.push(usersCollection.create({name: 'John', age: 30}));
    actionsArr.push(usersCollection.create({name: 'Petr', age: 63}));
    Promise.all(actionsArr).then(() => {
      usersCollection.find({name: 'Ivan'}).then((result) => {
        expect(result.length).toBe(1);
        expect(result[0].name).toBe('Ivan');
        expect(result[0].age).toBe(30);
        expect(typeof (result[0].uuid)).toBe('string');
      });
      usersCollection.find({age: 30}).then((result) => {
        expect(result.length).toBe(2);
        const ivan = result.find(user => user.name === 'Ivan');
        expect(ivan.age).toBe(30);
        const john = result.find(user => user.name === 'John');
        expect(john.age).toBe(30)
      });
      jest.runAllTimers();
    });
    jest.runAllTimers();
  });

  test('LocalStorageCollection find by id', () => {
    const storage = createStorage('test_storage', 10, ['localstorage']);
    const usersCollection = storage.createCollection('users', {
      name: {
        type: 'string',
      },
      age: {
        type: 'number',
        index: true,
      }
    });
    const actionsArr = [];
    expect.assertions(2);
    actionsArr.push(usersCollection.create({name: 'Ivan', age: 30}));
    actionsArr.push(usersCollection.create({name: 'Igor', age: 28}));
    actionsArr.push(usersCollection.create({name: 'Petr', age: 45}));
    actionsArr.push(usersCollection.create({name: 'John', age: 30}));
    actionsArr.push(usersCollection.create({name: 'Petr', age: 63}));
    Promise.all(actionsArr).then((results) => {
      const id1 = results[0].uuid;
      usersCollection.find({uuid: id1}).then((result) => {
        expect(result.length).toBe(1);
        expect(result[0].uuid).toBe(id1);
      });
      jest.runAllTimers();
    });
    jest.runAllTimers();
  });

  test('LocalStorageCollection find by few indexes', () => {
    const storage = createStorage('test_storage', 11, ['localstorage']);
    const usersCollection = storage.createCollection('users', {
      name: {
        type: 'string',
        index: true,
      },
      age: {
        type: 'number',
        index: true,
      }
    });
    const actionsArr = [];
    expect.assertions(4);
    actionsArr.push(usersCollection.create({name: 'Ivan', age: 30}));
    actionsArr.push(usersCollection.create({name: 'Igor', age: 28}));
    actionsArr.push(usersCollection.create({name: 'Petr', age: 45}));
    actionsArr.push(usersCollection.create({name: 'Ivan', age: 30}));
    actionsArr.push(usersCollection.create({name: 'John', age: 30}));
    actionsArr.push(usersCollection.create({name: 'Petr', age: 63}));
    Promise.all(actionsArr).then(() => {
      usersCollection.find({age: 30, name: 'Ivan'}).then((result) => {
        expect(result.length).toBe(2);
        expect(result[0].name).toBe('Ivan');
        expect(result[0].age).toBe(30);
        expect(typeof (result[0].uuid)).toBe('string');
      });
      jest.runAllTimers();
    });
    jest.runAllTimers();
  });

  test('LocalStorageCollection findById', () => {
    const storage = createStorage('test_storage', 12, ['localstorage']);
    const usersCollection = storage.createCollection('users', {
      name: {
        type: 'string',
        index: true,
      },
      age: {
        type: 'number',
      }
    });
    const arr = [];
    expect.assertions(2);
    arr.push({name: 'Ivan', age: 30});
    arr.push({name: 'Igor', age: 28});
    arr.push({name: 'Petr', age: 45});
    arr.push({name: 'John', age: 20});
    usersCollection.batchCreate(arr).then(results => {
      const id = results[0].uuid;
      usersCollection.findById(id).then(result => {
        expect(result.name).toBe('Ivan');
        expect(result.uuid).toBe(id);
      });
      jest.runAllTimers();
    });
    jest.runAllTimers();
  });

});



