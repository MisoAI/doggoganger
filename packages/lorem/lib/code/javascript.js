export function javaScript(lorem, { blocks = [2, 4] } = {}) {
  const blockCount = lorem.prng.randomInt(...blocks);
  const selected = lorem.utils.select(CODE_BLOCKS, blockCount);
  return selected.join('\n\n');
}

const CODE_BLOCKS = [
  `// module
import { a, b } from './module';
import * as module from './module';
import module from './module';
export default module;
export const a = 0;
export * from './module';
export * as module from './module';`,

  `// variables
let a = 10;
const b = 20;`,

  `// function declaration
function sum(x, y) {
  return x + y;
}`,

  `// generator function
function* iterator() {
  yield 0;
  yield 1;
}`,

  `// arrow function
const multiply = (x, y) => x * y;`,

  `// class
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  greet() {
    console.log('Hello, my name is Miso.');
  }
}`,

  `// primitive
const str = 'Hello, world!';
const num = 10.99;`,

  `// object
const person = new Person('John', 30);
person.greet();`,

  `// object literal
const object = {
  name: 'John',
  [x]: 10,
  ...props,
};`,

  `// array literal
const arr = [1, 2, 3, 4, 5, ...props];`,

  `// regexp literal
const regexp = /\\w+/g;`,

  `// operators
const sum = a + b;
const product = a * b;
const negation = -a;
const max = a > b ? a : b;`,

  `// flow control
let i = 9;
for (const n of arr) {
  if (n > i) {
    console.log(n);
  }
  i++;
}`,

  `// async/await
(async () => {
  const result = await asyncFunction();
})();`,

  `// try/catch
try {
} catch (e) {
}`,

  `// destructing
const { name, age, ...rest } = person;
const [ x, y, ...rest ] = arr;`,

  `// template literals
console.log(\`The sum of \${a} and \${b} is \${sum(a, b)}.\`);`,
];
