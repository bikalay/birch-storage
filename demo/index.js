import { createStorage } from '../lib/index';

const storage = createStorage('test', 55);
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

/*

const arr = [];

for(let i=1; i<1000; i++) {
  arr.push(collection.create({name:'name'+i, age: i}));
}
console.time('create 1000');
Promise.all(arr).then(() => {
  console.timeEnd('create 1000');
  console.time('read 1000');
  collection.find({}).then((result) => {
    console.log(result.length);
    console.timeEnd('read 1000');
  });
});
*/


console.time('batchcreate 1000');
const arr2 = [];
for(let i=1; i<10; i++) {
  arr2.push({name:'name'+i, age: i});
}
console.time('onlybatchcreate 1000');
collection.batchCreate(arr2).then(() => {
  console.timeEnd('onlybatchcreate 1000');
  console.timeEnd('batchcreate 1000');
  console.log(localStorage.length);
});
console.log('!!!!!!!(1)!!!!!!!!!');
collection.findById().then(()=>{
  console.log('!!!!!!!(3)!!!!!!!!!');
});
console.log('!!!!!!!(2)!!!!!!!!!');



/*console.time('read 1000');
  collection.find({}).then((result) => {
    console.timeEnd('read 1000');
    console.log(result.length);
    console.log(result[100]);
  });*/



