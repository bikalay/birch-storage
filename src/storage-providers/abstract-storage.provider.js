/* @flow */
import EventEmitter from 'events';
import uuid from 'uuid';

import { generateObjectId } from '../utils/mogodb-objectid.generator';

export type QueryOptions = {orderBy?: string, skip?: number, limit?: number};

export type StorageOptions = {idFieldName?: string, idFieldType?: 'guid' | 'objectid' };

export type CollectionField = {
  type: 'string' | 'number' | 'date' | 'boolean',
  default: string | number | Date | boolean,
  index?: boolean,
  required?: boolean
}

export type CollectionSchema = {[id: string]: CollectionField}


export interface ICollection {
  select(query: any, options?: ?QueryOptions): Promise<any>;
  insert(data: any): Promise<any>;
  update(query: any, data: any): Promise<any>;
  remove(query: any): Promise<any>;
}

export interface IStorageProvider {
  getCollection(collectionName: string): ICollection;
  createCollection(collectionName: string, schems: CollectionSchema): ICollection;
}

export class AbstractStorageProvider extends EventEmitter implements IStorageProvider {
  storageName: string;
  storageVersion: number;
  options: {idFieldName: string, idFieldType: 'guid' | 'objectid' };

  static check(): boolean {
    throw new Error('Need override abstract static method check')
  }

  constructor(storageName: string, storageVersion: number, options?: StorageOptions = {}) {
    super();
    this.storageName = storageName;
    this.storageVersion = storageVersion;

    this.options = {
      idFieldName: options.idFieldName || 'uuid',
      idFieldType: options.idFieldType || 'guid'
    };
  }

  generateId(): string {
    switch(this.options.idFieldType) {
      case 'objectid':
        return generateObjectId();
      default:
        return uuid.v4();
    }
  }

  // eslint-disable-next-line no-unused-vars
  createCollection(collectionName: string, schema: CollectionSchema): ICollection {
    throw new Error('Need override abstract method getCollection');
  }

  // eslint-disable-next-line no-unused-vars
  getCollection(collectionName: string): ICollection {
    throw new Error('Need override abstract method getCollection');
  }

  clear() {
    throw new Error('Need override abstract method clear');
  }
}

