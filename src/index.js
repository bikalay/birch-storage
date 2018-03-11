/* @flow */

export type StorageType = 'websql' | 'indexeddb' | 'localstorage' | 'memory';

export function createStorage(storageName: string, storageVersion: number, storageType: StorageType | Array<StorageType>) {

}
