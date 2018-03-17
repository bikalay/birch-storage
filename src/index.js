/* @flow */
import type { StorageOptions } from './storage-providers/abstract-storage.provider';
import {
  AbstractStorageProvider, IStorageProvider
} from './storage-providers/abstract-storage.provider';
import { LocalStorageProvider } from './storage-providers/index';

const STORAGES: {[id: string]: Class<AbstractStorageProvider>} = {
  localstorage: LocalStorageProvider
};

const defaultStorageTypes = ['indexeddb', 'localstorage', 'websql', 'memory'];

export type StorageType = 'websql' | 'indexeddb' | 'localstorage' | 'memory';

export function createStorage (
  storageName: string,
  storageVersion: number,
  storageType?: StorageType | Array<StorageType> = defaultStorageTypes,
  options?: StorageOptions = {} ): ?IStorageProvider {

  if(Array.isArray(storageType)) {
    for (let i = 0; i < storageType.length; i++) {
      const _storageType = storageType[i];
      if(STORAGES[_storageType] && STORAGES[_storageType].check()) {
        return new STORAGES[_storageType](storageName, storageVersion, options);
      }
    }
  } else {
    switch(storageType) {
      case 'localstorage':
        if (LocalStorageProvider.check()) {
          return new LocalStorageProvider(storageName, storageVersion, options);
        }
        return null;
      default:
        return null;
    }
  }
}
