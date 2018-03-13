/* @flow */

import { IStorageProvider } from './storage-providers/abstract-storage.provider';
import { LocalStorageProvider } from './storage-providers/localstorage.provider';

export type StorageType = 'websql' | 'indexeddb' | 'localstorage' | 'memory';

export function createStorage(storageName: string, storageVersion: number, storageType?: StorageType | Array<StorageType>): IStorageProvider {
  return new LocalStorageProvider(storageName, storageVersion);
}
