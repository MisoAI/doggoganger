# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Doggoganger is a mock API endpoint service for Miso that simulates API responses for demo and testing purposes. It generates fake but realistic data for search, recommendations, ask, and product APIs.

## Commands

```bash
# Install dependencies
npm install

# Start the mock server (default port 9901)
npm start

# Start in development mode with verbose logging
npm run dev

# Build browser bundle
npm run build

# Run tests
npm test

# Set version across all packages (for releases)
npm run version <version>
```

### CLI Options
The `doggoganger` CLI supports:
- `-p, --port <port>` - API port (default: 9901)
- `-v, --verbose` - Enable verbose logging
- `-w, --watch` - Watch files for changes
- `-s, --serve` - Serve static files

## Architecture

This is a monorepo with three packages:

### packages/doggoganger
Main package providing the Koa-based HTTP server. Entry points:
- `cli/index.js` - CLI entry point, handles nodemon watch mode
- `src/doggoganger.js` - Server setup with Koa, CORS, body parsing
- `src/route/` - API route handlers for `/api` and `/v1` prefixes
- `src/browser.js` - Browser bundle entry for UMD distribution

API endpoints mounted:
- `/ask` - Question answering API
- `/search` - Search API
- `/recommendation` - Recommendation API
- `/interactions` - User interactions API
- `/products` - Product catalog API

### packages/doggoganger-api
Core API logic module. Provides the `Api` class that encapsulates:
- `lib/api/` - API implementations (Ask, Search, Recommendation, Interactions, Products)
- `lib/data/` - Data generators for mock responses (answers, articles, facets, products, etc.)

### packages/lorem
Lorem ipsum generator for creating fake content. Provides:
- `lib/lorem.js` - Configurable text generation with decorators (title, description, multiline)
- `lib/fields.js` - Field generators
- `lib/markdown.js` - Markdown content generation

## Key Patterns

- All packages use ES modules (`"type": "module"`)
- Workspace dependencies use `file:packages/<name>` syntax during development
- The `bin/version.js` script converts file references to version numbers during release
- Browser bundle is built with Rollup to `dist/umd/`

## Reference

- [Miso API](https://api.askmiso.com/)
