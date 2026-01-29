export function javascript() {
  return JAVASCRIPT;
}

export function js() {
  return JAVASCRIPT;
}

const JAVASCRIPT = `
// module
import { a, b } from './module';
import * as module from './module';
import module from './module';
export default module;
export const a = 0;
export * from './module';
export * as module from './module';

// variables
let a = 10;
const b = 20;

// function declaration
function sum(x, y) {
  return x + y;
}

// generator function
function* iterator() {
  yield 0;
  yield 1;
}

// arrow function
const multiply = (x, y) => x * y;

// class
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    console.log('Hello, my name is Miso.');
  }
}

// primitive
const str = 'Hello, world!';
const num = 10.99;

// object
const person = new Person('John', 30);
person.greet();

// object literal
const object = {
  name: 'John',
  [x]: 10,
  ...props,
};

// array literal
const arr = [1, 2, 3, 4, 5, ...props];

// regexp literal
const regexp = /\\w+/g;

// operators
const sum = a + b;
const product = a * b;
const negation = -a;
const max = a > b ? a : b;

// flow control
let i = 9;
for (const n of arr) {
  if (n > i) {
    console.log(n);
  }
  i++;
}

// async/await
(async () => {
  const result = await asyncFunction();
})();

// try/catch
try {
} catch (e) {
}

// destructuring
const { name, age, ...rest } = person;
const [ x, y, ...rest ] = arr;

// template literals
${'console.log(`The sum of ${a} and ${b} is ${sum(a, b)}.`);'}
`.trim();

export function html() {
  return HTML;
}

const HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>

  <main>
    <h1>Welcome</h1>
    <p>This is a <strong>sample</strong> paragraph with <em>emphasis</em>.</p>

    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>

    <form action="/submit" method="post">
      <label for="name">Name:</label>
      <input type="text" id="name" name="name" required>
      <button type="submit">Submit</button>
    </form>

    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Alpha</td>
          <td>100</td>
        </tr>
      </tbody>
    </table>
  </main>

  <footer>
    <p>&copy; 2024 Example</p>
  </footer>

  <script src="main.js"></script>
</body>
</html>
`.trim();
