import { indent } from './helpers.js';

export function html(lorem, { blocks = [2, 4] } = {}) {
  const blockCount = lorem.prng.randomInt(...blocks);
  const selected = lorem.utils.select(ALL_BLOCKS, blockCount);
  const hasHead = selected.includes(HEAD_BLOCK);
  const bodyBlocks = selected.filter(b => b !== HEAD_BLOCK);
  const head = hasHead
    ? `\n  <head>\n${indent(HEAD_BLOCK, 4)}\n  </head>`
    : '';
  const body = bodyBlocks.map(b => indent(b, 4)).join('\n\n');
  return `<!DOCTYPE html>
<html lang="en">${head}
  <body>
${body}
  </body>
</html>`;
}

const HEAD_BLOCK = `<!-- head -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sample Page</title>
<link rel="stylesheet" href="styles.css">`;

const ALL_BLOCKS = [
  HEAD_BLOCK,

  `<!-- header -->
<h1>Welcome</h1>`,

  `<!-- typography -->
<p>This is a <strong>sample</strong> paragraph with <em>emphasis</em>.</p>`,

  `<!-- link -->
<a href="/">Link</a>`,

  `<!-- escaped -->
<p>&copy; 2024 Example</p>`,

  `<!-- list -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>`,

  `<!-- form -->
<form action="/submit" method="post">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" required>
  <button type="submit">Submit</button>
</form>`,

  `<!-- script -->
<script src="main.js"></script>`,
];
