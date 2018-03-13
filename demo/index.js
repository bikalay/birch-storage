import { createStorage } from '../lib/index';

const storage = createStorage('test',6);
const collection = storage.createCollection('users', {
  name: {
    type: 'string',
    index: true,
    required: true,
  },
  age: {
    type: 'number',
    index: true,
    required: true
  }
});
console.time('create 1000');
for(let i=1; i<1000; i++) {
  collection.insert({name:'name'+i, age: i});
}
console.timeEnd('create 1000');

console.time('read 1000');
  collection.find({}).then((result) => {
    console.timeEnd('read 1000');
    console.log(result.length);
    console.log(result[100]);
  });



