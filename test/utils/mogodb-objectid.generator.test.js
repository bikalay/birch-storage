import { generateObjectId } from '../../src/utils/mogodb-objectid.generator';

test('generateSuccess', () => {
  const objectId = generateObjectId();
  expect(typeof(objectId)).toBe('string');
  expect(objectId.length).toBe(24);
});

test('right objectId date', () => {
  const objectId = generateObjectId();
  const seconds = parseInt(objectId.substr(0, 8), 16);
  expect(seconds).toBe(parseInt(Date.now()/1000));
});
