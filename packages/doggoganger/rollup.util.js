import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import serve from 'rollup-plugin-serve';

export function config(env) {
  const prod = env === 'prod';
  let plugins;
  if (prod) {
    plugins = [
      nodeResolve(),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false
        },
      }),
    ];
  } else {
    plugins = [
      nodeResolve(),
      serve({
        port: 10098,
      }),
    ];
  }
  return {
    input: `src/browser.js`,
    output: {
      file: prod ? `dist/umd/doggoganger-browser.min.js` : `dist/umd/doggoganger-browser.js`,
      format: 'umd',
      name: 'doggoganger',
      exports: 'default',
      indent: !prod,
    },
    watch: !prod,
    plugins,
  };
}
