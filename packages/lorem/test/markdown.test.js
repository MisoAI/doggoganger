import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { lorem } from '../lib/index.js';

test('indented code blocks never directly follow a list', () => {
  for (let seed = 0; seed < 100; seed++) {
    const md = lorem({ seed }).markdown.markdown({ blocks: [30, 30] });
    // Ignore fenced block contents; they may contain list-looking lines
    const outsideFences = md.replace(/```[\s\S]*?```/g, '');
    // A list item line, a blank line, then a 4-space indent is absorbed into
    // the list item per CommonMark instead of parsing as a code block
    assert.not.match(outsideFences, /\n *(?:- |\d+\. )[^\n]*\n\n {4}/, `seed ${seed}`);
  }
});

test('strikethrough adfix uses GFM double tildes', () => {
  const markdown = lorem({ seed: 42 }).markdown;
  assert.equal(markdown._INLINE_FEATURES['strikethrough'](), ['~~', '~~']);
});

test.run();
