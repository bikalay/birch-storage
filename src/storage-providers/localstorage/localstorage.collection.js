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

  getKeysByIndex(field: string, value: any) {
    if (this.schema[field] && this.schema[field].index) {
      const indexKey = `birch:${this.storage.storageName}:${this.name}:index:${field}:${value.toString()}`;
      const idsString = localStorage.getItem(indexKey);
      if(idsString) {
        return idsString.split(',');
      }
      return [];
    }
    throw new Error('To search add index on this field before');
  }

  find(query: any, options?: ?QueryOptions): Promise<Array<any>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const queryKeys = Object.keys(query);
        const items = [];
        const itemId = query[this.storage.options.idFieldName];
        if (queryKeys.length === 0) {
          const indexKey = `birch:${this.storage.storageName}:${this.name}:index`;
          const idsString = localStorage.getItem(indexKey);
          if(idsString) {
            const ids = idsString.split(',');
            ids.forEach((itemId) => {
              const result = localStorage.getItem(`birch:${this.storage.storageName}:${this.name}:${itemId}`);
              if(result) {
                items.push(JSON.parse(result));
              }
            });
            return resolve(items);
          }
        } else if (itemId) {
          const item = localStorage.getItem(`birch:${this.storage.storageName}:${this.name}:${itemId}`);
          if (item) {
            return resolve([JSON.parse(item)]);
          }
        } else {
          let resultIds = [];
          queryKeys.forEach((key, index) => {
            const ids = this.getKeysByIndex(key, query[key]);
            if (index === 0) {
              resultIds = ids;
            } else {
              resultIds = ids.filter(id => resultIds.indexOf(id) > -1);
            }
          });
          resultIds.forEach((itemId) => {
            const result = localStorage.getItem(`birch:${this.storage.storageName}:${this.name}:${itemId}`);
            if(result) {
              items.push(JSON.parse(result));
            }
          });
          return resolve(items);
        }
        return resolve(items);
      }, 0);
    });
  }

  findOne(query: any, options?: ?QueryOptions): Promise<any> {
    throw new Error('need override');
  }

  findById(id: string, options?: ?QueryOptions): Promise<any> {
    return new Promise(resolve => {
      setTimeout(() => {
        const item = localStorage.getItem(`birch:${this.storage.storageName}:${this.name}:${id}`);
        if (item) {
          return resolve(JSON.parse(item));
        }
        resolve();
      }, 0);
    })
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

  updateIndex(object: {[id: string]: any}, field: string, itemId: string) {
    const value = object[field];
    let ids = [];
    const indexKey = `birch:${this.storage.storageName}:${this.name}:index:${field}:${value}`;
    const idsString = localStorage.getItem(indexKey);
    if(idsString) {
      ids = idsString.split(',');
    }
    ids.push(itemId);
    localStorage.setItem(indexKey, ids.join(','));
  }

  insertItem(data: any, keys: Array<string>, idFieldName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const insertObject: {[id: string]: any} = {};

        let itemId = data[idFieldName];

        if(!itemId) {
          itemId = insertObject[idFieldName] = this.storage.generateId();
        }

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const schemaField = this.schema[key];
          const field = data[key];
          if ((field === void(0) || field === '') && schemaField.required && schemaField.default === void(0)) {
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
            this.updateIndex(insertObject, key, itemId);
          }
        }
        localStorage.setItem(`birch:${this.storage.storageName}:${this.name}:${itemId}`, JSON.stringify(insertObject));
        return resolve(insertObject);
      }, 0);
    });
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
    const keys = Object.keys(this.schema);
    const idFieldName = this.storage.options.idFieldName;
    return this.insertItem(data, keys, idFieldName).then((insertObject) => {
      this.updateCollectionIndex(insertObject[idFieldName]);
      return insertObject;
    });
  }

  batchCreate(array: Array<any>): Promise<Array<any>> {
    const keys = Object.keys(this.schema);
    const idFieldName = this.storage.options.idFieldName;
    const ids = [];
    return Promise.all(array.map(data => this.insertItem(data, keys, idFieldName).then((insertObject) => {
        ids.push(insertObject[idFieldName]);
        return insertObject;
      }))).then((results) => {
      this.batchUpdateCollectionIndexs(ids);
      return results;
    });
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
