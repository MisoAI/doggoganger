// Main entry point - creates a seeded Lorem instance with all utilities attached
export * from './lorem.js';
export { default as version } from './version.js';

// Export classes for direct use if needed
export { Words } from './words.js';
export { Markdown as Md } from './markdown.js';
export { Fields } from './fields.js';
export { Utils } from './utils.js';
export { randomSeed } from './prng.js';
