/* @flow */
/* global localStorage:false */
/* global setTimeout:false */

import { ValidationError } from '../../errors/validation.error';
import type { QueryOptions, ICollection, CollectionSchema } from '../abstract-storage.provider';
import { LocalStorageProvider } from './localstorage.provider';

export class LocalStorageCollection implements ICollection {
  name: string;
  schema: CollectionSchema;
  storage: LocalStorageProvider;

  constructor(storage: LocalStorageProvider, name: string, schema: CollectionSchema) {
    this.name = name;
    this.schema = schema;
    this.storage = storage;
  }

  find(query: any, options?: ?QueryOptions): Promise<Array<any>> {
    const indexKey = `birch:${this.storage.storageName}:${this.name}:index`;
    const idsString = localStorage.getItem(indexKey);
    if(idsString) {
      const ids = idsString.split(',');
      const items = ids.map((itemId) => localStorage.getItem(`birch:${this.storage.storageName}:${this.name}:${itemId}`));
      return Promise.resolve(items);
    }
    return Promise.resolve([]);
  }

  findOne(query: any, options?: ?QueryOptions): Promise<any> {
    throw new Error('need override');
  }

  findById(id: string, options?: ?QueryOptions): Promise<any> {
    return Promise.resolve(localStorage.getItem(`birch:${this.storage.storageName}:${this.name}:${id}`));
  }

  updateCollectionIndex(itemId: string) {
    let ids = [];
    const indexKey = `birch:${this.storage.storageName}:${this.name}:index`;
    const idsString = localStorage.getItem(indexKey);
    if(idsString) {
      ids = idsString.split(',');
    }
    const index = ids.indexOf(itemId);
    if(index === -1) {
      ids.push(itemId);
      localStorage.setItem(indexKey, ids.join(','));
    }
  }

  batchUpdateCollectionIndexs(itemsIds: Array<string>) {
    let ids = [];
    const indexKey = `birch:${this.storage.storageName}:${this.name}:index`;
    const idsString = localStorage.getItem(indexKey);
    if(idsString) {
      ids = idsString.split(',');
    }
    itemsIds.forEach(itemId => {
      const index = ids.indexOf(itemId);
      if(index === -1) {
        ids.push(itemId);
      }
    });
    localStorage.setItem(indexKey, ids.join(','));
  }

  create(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const insertObject: {[id: string]: any} = {};
        const keys = Object.keys(this.schema);
        const idFieldName = this.storage.options.idFieldName;

        let itemId = data[idFieldName];

        if(!itemId) {
          itemId = insertObject[idFieldName] = this.storage.generateId();
        }

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const schemaField = this.schema[key];
          const field = data[key];
          if ((field === void(0) || field === null || field === '')
            && schemaField.required
            && schemaField.default === void(0)) {
            return reject(new ValidationError(`Field ${key} is required`, key));
          }
          if (field === void(0) && schemaField.default !== void(0)) {
            if (typeof(schemaField.default) === 'function') {
              insertObject[key] = schemaField.default();
            } else {
              insertObject[key] = schemaField.default;
            }
          } else if(field) {
            insertObject[key] = field;
          }
          if (schemaField.index) {
            const value = insertObject[key];
            let ids = [];
            const indexKey = `birch:${this.storage.storageName}:${this.name}:index:${key}:${value}`;
            const idsString = localStorage.getItem(indexKey);
            if(idsString) {
              ids = idsString.split(',');
            }
            ids.push(itemId);
            localStorage.setItem(indexKey, ids.join(','));
          }
        }

        localStorage.setItem(`birch:${this.storage.storageName}:${this.name}:${itemId}`, JSON.stringify(insertObject));
        this.updateCollectionIndex(itemId);
        resolve(insertObject);
      }, 0);
    });
  }

  batchCreate(array: Array<any>): Promise<Array<any>> {
    const keys = Object.keys(this.schema);
    const idFieldName = this.storage.options.idFieldName;
    const result = [];
    const _ids = [];
    array.forEach((data) => {
      const insertObject: {[id: string]: any} = {};

      let itemId = data[idFieldName];

      if(!itemId) {
        itemId = insertObject[idFieldName] = this.storage.generateId();
      }

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const schemaField = this.schema[key];
        const field = data[key];
        if (field === void(0) && schemaField.required && schemaField.default === void(0)) {
          return Promise.reject(new ValidationError(`Field ${key} is required`, key));
        }
        if (field === void(0) && schemaField.default !== void(0)) {
          if (typeof(schemaField.default) === 'function') {
            insertObject[key] = schemaField.default();
          } else {
            insertObject[key] = schemaField.default;
          }
        } else if(field) {
          insertObject[key] = field;
        }
        if (schemaField.index) {
          const value = insertObject[key];
          let ids = [];
          const indexKey = `birch:${this.storage.storageName}:${this.name}:index:${key}:${value}`;
          const idsString = localStorage.getItem(indexKey);
          if(idsString) {
            ids = idsString.split(',');
          }
          ids.push(itemId);
          localStorage.setItem(indexKey, ids.join(','));
        }
      }
      localStorage.setItem(`birch:${this.storage.storageName}:${this.name}:${itemId}`, JSON.stringify(insertObject));
      result.push(insertObject);
      _ids.push(itemId);
    });

    this.batchUpdateCollectionIndexs(_ids);
    return Promise.resolve(result);
  }

  update(query: any, data: any): Promise<any> {
    throw new Error('need override');
  }


  batchUpdate(query: any, data: any): Promise<Array<any>> {
    throw new Error('need override');
  }


  remove(query: any): Promise<any> {
    throw new Error('need override');
  }

  clear() {
    /*let ids = [];
    const indexKey = `birch:${this.storage.storageName}:${this.name}:index`;
    const idsString = localStorage.getItem(indexKey);
    if(idsString) {
      ids = idsString.split(',');
    }
    ids.forEach((id) => {
      const key = `birch:${this.storage.storageName}:${this.name}:${id}`;
      localStorage.removeItem(key);
    });*/
  }
}
