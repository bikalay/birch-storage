/* @flow */
/* global localStorage:false */

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
      if (idsString) {
        return idsString.split(',');
      }
      return [];
    }
    throw new Error('To search add index on this field before');
  }

  getIdsByQuery(query: any = {}): Array<string> {
    const queryKeys = Object.keys(query);
    let result = [];
    const itemId = query[this.storage.options.idFieldName];
    if (itemId) {
      result = [itemId];
    } else if (queryKeys.length === 0) {
      const indexKey = `birch:${this.storage.storageName}:${this.name}:index`;
      const idsString = localStorage.getItem(indexKey);
      if (idsString) {
        result = idsString.split(',');
      }
    } else {
      queryKeys.forEach((key, index) => {
        const ids = this.getKeysByIndex(key, query[key]);
        if (index === 0) {
          result = ids;
        } else {
          result = ids.filter(id => result.indexOf(id) > -1);
        }
      });
    }
    return result;
  }

  find(query: any, options?: ?QueryOptions): Promise<Array<any>> {
    return new Promise((resolve) => {
      const items = [];
      const ids = this.getIdsByQuery(query);
      ids.forEach(id => {
        const result = localStorage.getItem(`birch:${this.storage.storageName}:${this.name}:${id}`);
        if (result) {
          items.push(JSON.parse(result));
        }
      });
      return resolve(items);
    });
  }

  findOne(query: any, options?: ?QueryOptions): Promise<?any> {
    return new Promise((resolve) => {
      const ids = this.getIdsByQuery(query);
      if (ids.length) {
        const id = ids[0];
        const result = localStorage.getItem(`birch:${this.storage.storageName}:${this.name}:${id}`);
        if (result) {
          return resolve(JSON.parse(result));
        }
      }
      return resolve();
    });
  }

  findById(id: string, options?: ?QueryOptions): Promise<?any> {
    return new Promise((resolve) => {
      const item = localStorage.getItem(`birch:${this.storage.storageName}:${this.name}:${id}`);
      if (item) {
        return resolve(JSON.parse(item));
      }
      resolve();
    });
  }

  updateCollectionIndex(itemId: string) {
    let ids = [];
    const indexKey = `birch:${this.storage.storageName}:${this.name}:index`;
    const idsString = localStorage.getItem(indexKey);
    if (idsString) {
      ids = idsString.split(',');
    }
    const index = ids.indexOf(itemId);
    if (index === -1) {
      ids.push(itemId);
      localStorage.setItem(indexKey, ids.join(','));
    }
  }

  updateIndex(object: { [id: string]: any }, field: string, itemId: string) {
    const value = object[field];
    let ids = [];
    const indexKey = `birch:${this.storage.storageName}:${this.name}:index:${field}:${value}`;
    const idsString = localStorage.getItem(indexKey);
    if (idsString) {
      ids = idsString.split(',');
    }
    ids.push(itemId);
    localStorage.setItem(indexKey, ids.join(','));
  }

  insertItem(data: any, keys: Array<string>, idFieldName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const insertObject: { [id: string]: any } = {};
      let itemId = data[idFieldName];

      if (!itemId) {
        itemId = this.storage.generateId();
      }

      insertObject[idFieldName] = itemId;

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
        } else if (field) {
          insertObject[key] = field;
        }
        if (schemaField.index) {
          this.updateIndex(insertObject, key, itemId);
        }
      }
      localStorage.setItem(`birch:${this.storage.storageName}:${this.name}:${itemId}`, JSON.stringify(insertObject));
      return resolve(insertObject);
    });
  }

  batchUpdateCollectionIndexs(itemsIds: Array<string>) {
    let ids = [];
    const indexKey = `birch:${this.storage.storageName}:${this.name}:index`;
    const idsString = localStorage.getItem(indexKey);
    if (idsString) {
      ids = idsString.split(',');
    }
    itemsIds.forEach(itemId => {
      const index = ids.indexOf(itemId);
      if (index === -1) {
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
    return new Promise(resolve => {
      const ids = this.getIdsByQuery(query);
      const indexKey = `birch:${this.storage.storageName}:${this.name}:index`;
      const idsString = localStorage.getItem(indexKey);
      let indexes = [];

      if (idsString) {
        indexes = idsString.split(',');
      }

      ids.forEach(id => {
        localStorage.removeItem(id);
        const i = indexes.indexOf(id);
        if (i > -1) {
          indexes.splice(i, 1);
        }
      });
      localStorage.setItem(indexKey, indexes.join(','));
      resolve({count: ids.length});
    });
  }

  count(query: any): Promise<number> {
    return new Promise(resolve => resolve(this.getIdsByQuery(query).length));
  }

  clear() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.indexOf(`birch:${this.storage.storageName}:${this.name}:`) > -1) {
        localStorage.removeItem(key);
      }
    }
  }
}
