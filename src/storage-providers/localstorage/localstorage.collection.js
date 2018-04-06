/* @flow */
/* global localStorage:false */

import { ValidationError } from '../../errors/validation.error';
import type { QueryOptions, ICollection, CollectionSchema } from '../abstract-storage.provider';
import { LocalStorageProvider } from './localstorage.provider';

export class LocalStorageCollection implements ICollection {
  name: string;
  schema: CollectionSchema;
  storage: LocalStorageProvider;
  indexes: Array<string> = [];
  idFieldName: string;
  idFieldType: string;

  constructor(storage: LocalStorageProvider, name: string, schema: CollectionSchema, options: any = {}) {
    this.name = name;
    this.schema = schema;
    this.storage = storage;
    this.idFieldName = options.idFieldName || storage.options.idFieldName;
    this.idFieldType = options.idFieldType || storage.options.idFieldType;
    this.indexes = this.__collectIndexes(this.schema);
  }

  __collectIndexes(schema: any, fieldName?: ?string, indexes?: Array<string> =[]): Array<string> {
    const keys = Object.keys(schema);
    const inputFieldName = fieldName;
    keys.forEach(key => {
      const field = schema[key];
      const fieldPath = fieldName ? fieldName.split('.') : [];
      fieldPath.push(key);
      fieldName = fieldPath.join('.');
      if (Object.prototype.toString.call(field) === '[object Object]' && !field.type) {
        return this.__collectIndexes(field, fieldName, indexes);
      } else if (field.index) {
        indexes.push(fieldName);
      }
      fieldName = inputFieldName;
    });
    return indexes
  }

  __getValueByIndex(item: any, index: string) {
    const indexPath = index.split('.');
    const fieldName = indexPath.shift();
    const value = item[fieldName];
    if (indexPath.length === 0) {
      return value;
    }
    return this.__getValueByIndex(value, indexPath.join('.'));
  }

  __getKeysByIndex(field: string, value: any) {
      const indexKey = `birch:${this.storage.storageName}:${this.name}:index:${field}:${value.toString()}`;
      const idsString = localStorage.getItem(indexKey);
      if (idsString) {
        return idsString.split(',');
      }
      return [];
  }

  __getIdsByQuery(query: any = {}): Array<string> {
    const queryKeys = Object.keys(query);
    let result = [];
    const itemId = query[this.idFieldName];
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
        const ids = this.__getKeysByIndex(key, query[key]);
        if (index === 0) {
          result = ids;
        } else {
          result = ids.filter(id => result.indexOf(id) > -1);
        }
      });
    }
    return result;
  }

  __updateCollectionIndex(itemId: string) {
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

  __updateIndex(object: { [id: string]: any }, itemId: string) {
    this.indexes.forEach(index => {
      const value = this.__getValueByIndex(object, index);
      let ids = [];
      const indexKey = `birch:${this.storage.storageName}:${this.name}:index:${index}:${value}`;
      const idsString = localStorage.getItem(indexKey);
      if (idsString) {
        ids = idsString.split(',');
      }
      ids.push(itemId);
      localStorage.setItem(indexKey, ids.join(','));
    });
  }

  __insertItem(data: any, keys: Array<string>, idFieldName: string): Promise<any> {
    return new Promise((resolve) => {
      const insertObject: { [id: string]: any } = this.__applyObject(data, this.schema);
      let itemId = data[idFieldName];
      if (!itemId) {
        itemId = this.storage.generateId();
      }
      insertObject[idFieldName] = itemId;
      localStorage.setItem(`birch:${this.storage.storageName}:${this.name}:${itemId}`, JSON.stringify(insertObject));
      return resolve(insertObject);
    });
  }

  __applyObject(object: any = {}, schema: any, insertObject: any = {}): any {
    const keys = Object.keys(schema);
    keys.forEach(key => {
      const schemaField = schema[key];
      const objectField = object[key];
      if (!schemaField.type
        && Object.prototype.toString.call(schemaField) === '[object Object]'
        && Object.prototype.toString.call(objectField) === '[object Object]'
      ) {
        const insertObjectField = insertObject[key] = {};
        return this.__applyObject(objectField, schemaField, insertObjectField);
      } else if(schemaField.type) {
        if ((objectField === void(0) || objectField === '' || objectField === null)
          && schemaField.required && schemaField.default === void(0)) {
          throw new ValidationError(`Field ${key} is required`, key);
        }
        if (objectField === void(0) && schemaField.default !== void(0)) {
          if (typeof(schemaField.default) === 'function') {
            insertObject[key] = schemaField.default();
          } else {
            insertObject[key] = schemaField.default;
          }
        } else if (objectField) {
          insertObject[key] = objectField;
        }
      }
    });
    return insertObject;
  }

  __batchUpdateCollectionIndexs(itemsIds: Array<string>) {
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

  find(query: any, options?: ?QueryOptions): Promise<Array<any>> {
    return new Promise((resolve) => {
      const items = [];
      const ids = this.__getIdsByQuery(query);
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
      const ids = this.__getIdsByQuery(query);
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

  create(data: any): Promise<any> {
    const keys = Object.keys(this.schema);
    const idFieldName = this.idFieldName;
    return this.__insertItem(data, keys, idFieldName).then((insertObject) => {
      this.__updateCollectionIndex(insertObject[idFieldName]);
      this.__updateIndex(insertObject, insertObject[idFieldName]);
      return insertObject;
    });
  }

  batchCreate(array: Array<any>): Promise<Array<any>> {
    const keys = Object.keys(this.schema);
    const idFieldName = this.storage.options.idFieldName;
    const ids = [];
    return Promise.all(array.map(data => this.__insertItem(data, keys, idFieldName).then((insertObject) => {
      ids.push(insertObject[idFieldName]);
      this.__updateIndex(insertObject, insertObject[idFieldName]);
      return insertObject;
    }))).then((results) => {
      this.__batchUpdateCollectionIndexs(ids);
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
      const ids = this.__getIdsByQuery(query);
      const indexKey = `birch:${this.storage.storageName}:${this.name}:index`;
      const idsString = localStorage.getItem(indexKey);
      let indexes = [];

      if (idsString) {
        indexes = idsString.split(',');
      }

      ids.forEach(id => {
        const itemKey = `birch:${this.storage.storageName}:${this.name}:${id}`;
        const strItem = localStorage.getItem(itemKey);
        if(strItem) {
          const item = JSON.parse(strItem);
          this.indexes.forEach(index => {
            const value = this.__getValueByIndex(item, index);
            const indexesKey = `birch:${this.storage.storageName}:${this.name}:index:${index}:${value}`;
            const indexesStr = localStorage.getItem(indexesKey);
            if (indexesStr) {
              const indexKeys = indexesStr.split(',');
              const i = indexKeys.indexOf(id);
              if (i > -1) {
                indexKeys.splice(i, 1);
                localStorage.setItem(indexesKey, indexKeys.join(','));
              }
            }
          });
        }
        localStorage.removeItem(itemKey);
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
    return new Promise(resolve => resolve(this.__getIdsByQuery(query).length));
  }

  clear(): Promise<null> {
    return new Promise(resolve => {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.indexOf(`birch:${this.storage.storageName}:${this.name}:`) > -1) {
          localStorage.removeItem(key);
        }
      }
      resolve(null);
    });
  }
}
