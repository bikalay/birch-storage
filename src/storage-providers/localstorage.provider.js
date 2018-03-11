/* @flow */
/* global localStorage:false */

import { ValidationError } from '../errors/validation.error';
import type { CollectionSchema, ICollection, QueryOptions } from './abstract-storage.provider';
import { AbstractStorageProvider  } from './abstract-storage.provider';

export type LocalStorageProperties = { version: number };

export class LocalStorageCollection implements ICollection {
  name: string;
  schema: CollectionSchema;
  storage: LocalStorageProvider;

  constructor(storage: LocalStorageProvider, name: string, schema: CollectionSchema) {
    this.name = name;
    this.schema = schema;
    this.storage = storage;
  }

  select(query: any, options?: ?QueryOptions): Promise<any> {
    throw new Error('need override');
  }

  updateIndexes(object: {[id: string]: any}) {
    const keys = Object.keys(this.schema);
    for (let i = 0; i < keys.length; i++) {

    }
  }

  insert(data: any): Promise<any> {
    const insertObject: {[id: string]: any} = {};
    const keys = Object.keys(this.schema);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const schemaField = this.schema[key];
      const field = data[key];
      if (!field && schemaField.required && !schemaField.default) {
        return Promise.reject(new ValidationError(`Field ${key} is required`, key));
      }
      if (!field && !schemaField.default) {
        if (typeof(schemaField.default) === 'function') {
          insertObject[key] = schemaField.default();
        }
        else {
          insertObject[key] = schemaField.default;
        }
      } else if(field) {
        insertObject[key] = field;
      }
    }
    let itemId = insertObject[this.storage.options.idFieldName];

    if(!itemId) {
      itemId = insertObject[this.storage.options.idFieldName] = this.storage.generateId();
    }

    localStorage.setItem(`birch:${this.storage.storageName}:${this.name}:${itemId}`, JSON.stringify(insertObject));
    return Promise.resolve(insertObject);
  }

  update(query: any, data: any): Promise<any> {
    throw new Error('need override');
  }

  remove(query: any): Promise<any> {
    throw new Error('need override');
  }
}

export class LocalStorageProvider extends AbstractStorageProvider {

  collections: {[id: string]: LocalStorageCollection};

  static check(): boolean {
    return typeof(Storage) !== 'undefined';
  }

  constructor(storageName: string, storageVersion: number) {
    super(storageName, storageVersion);
    const storageProps = this.getStorageProperties();
    if (storageProps) {
      if (storageProps.version > this.storageVersion) {
        throw new Error('You try to create storage with version less than current');
      }
      if (storageProps.version < this.storageVersion) {
        this.clear();
        localStorage.setItem(`birch:${this.storageName}:properties`, JSON.stringify({version: storageVersion}))
      }
    }
  }

  createCollection(collectionName: string, schema: CollectionSchema): ICollection {
    return this.collections[collectionName] = new LocalStorageCollection(collectionName, schema);
  }

  getStorageProperties(): ?LocalStorageProperties {
    const propsString = localStorage.getItem(`birch:${this.storageName}:properties`);
    if (propsString) {
      return JSON.parse(propsString);
    }
  }

  clear() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.indexOf(`birch:${this.storageName}:`) > -1) {
        localStorage.removeItem(key);
      }
    }
  }
}
