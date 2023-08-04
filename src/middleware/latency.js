import { delay, trimObj } from '../utils.js';
import { gaussRandom } from '../data/utils.js';

const DEFAULT_OPTIONS = {
  enabled: true,
  verbose: false,
  min: 200,
  max: 2000,
};

export default function latency(options) {
  const globalOptions = {
    ...DEFAULT_OPTIONS,
    ...trimObj(options),
  };
  return async (ctx, next) => {
    const { enabled, min, max, verbose } = {
      ...globalOptions, 
      ...getOptionsFromCtx(ctx),
    };
    if (enabled) {
      const time = (min + max) / 2 + gaussRandom() * (max - min) / 6;
      verbose && console.log(`Add latency: ${time}ms`);
      await delay(time);
    }
    await next();
  };
}

function getOptionsFromCtx(ctx) {
  const latencyStr = ctx.get('x-latency') || undefined;
  if (latencyStr === '0' || latencyStr === 'false') {
    return { enabled: false };
  }
  const value = Number(latencyStr) || undefined;
  const min = value || Number(ctx.get('x-latency-min')) || undefined;
  const max = value || Number(ctx.get('x-latency-max')) || undefined;
  return trimObj({ min, max });
}
