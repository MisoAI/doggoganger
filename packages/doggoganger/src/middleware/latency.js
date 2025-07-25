import { delay, trimObj } from '../utils.js';
import { utils } from '@miso.ai/lorem';

const DEFAULT_OPTIONS = {
  enabled: true,
  verbose: false,
  min: 100,
  max: 5000,
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
      const time = utils.rollLatency(min, max);
      verbose && console.log(`Add request latency: ${time}ms`);
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
