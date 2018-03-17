/* @flow */
/* global localStorage:false */


import type { CollectionSchema, ICollection, StorageOptions } from '../abstract-storage.provider';
import { AbstractStorageProvider } from '../abstract-storage.provider';
import { LocalStorageCollection } from './localstorage.collection';

export type LocalStorageProperties = { version: number };



export class LocalStorageProvider extends AbstractStorageProvider {

  collections: {[id: string]: LocalStorageCollection};

  static check(): boolean {
    return typeof(Storage) !== 'undefined';
  }

  constructor(storageName: string, storageVersion: number, options?: StorageOptions = {}) {
    super(storageName, storageVersion, options);
    this.collections = {};
    const storageProps = this.getStorageProperties();
    if (storageProps) {
      if (storageProps.version > this.storageVersion) {
        throw new Error('You try to create storage with version less than current');
      }
      if (storageProps.version < this.storageVersion) {
        this.clear();
      }
    }
    localStorage.setItem(`birch:${this.storageName}:properties`, JSON.stringify({version: this.storageVersion}))
  }

  createCollection(collectionName: string, schema: CollectionSchema): ICollection {
    return this.collections[collectionName] = new LocalStorageCollection(this, collectionName, schema);
  }

  getStorageProperties(): ?LocalStorageProperties {
    const propsString = localStorage.getItem(`birch:${this.storageName}:properties`);
    if (propsString) {
      return JSON.parse(propsString);
    }
  }

  clear() {
    for (let i = localStorage.length-1; i >= 0 ; i--) {
      const key = localStorage.key(i);
      if (key && key.indexOf(`birch:${this.storageName}:`) > -1) {
        localStorage.removeItem(key);
      }
    }
  }
}
