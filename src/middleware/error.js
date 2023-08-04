import { trimObj } from '../utils.js';

const DEFAULT_OPTIONS = {
  rate: 0,
  verbose: false,
};

export default function error(options) {
  const globalOptions = {
    ...DEFAULT_OPTIONS,
    ...trimObj(options),
  };
  return async (ctx, next) => {
    const { rate, verbose } = {
      ...globalOptions, 
      ...getOptionsFromCtx(ctx),
    };
    if (rate && Math.random() < rate) {
      verbose && console.log(`Simulate error`);
      throw new Error();
    }
    await next();
  };
}

function getOptionsFromCtx(ctx) {
  const rate = Number(ctx.get('x-error-rate')) || undefined;
  return trimObj({ rate });
}
