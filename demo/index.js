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

collection.clear();

console.time('create 1000');
for(let i=1; i<1000; i++) {
  collection.create({name:'name'+i, age: i});
}
console.timeEnd('create 1000');

console.time('batchcreate 1000');
const arr = []
for(let i=1; i<1000; i++) {
  arr.push({name:'name'+i, age: i});
}
console.time('onlybatchcreate 1000');
collection.batchCreate(arr);
console.timeEnd('onlybatchcreate 1000');
console.timeEnd('batchcreate 1000');

console.time('read 1000');
  collection.find({}).then((result) => {
    console.timeEnd('read 1000');
    console.log(result.length);
    console.log(result[100]);
  });



