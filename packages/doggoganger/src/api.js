import { api } from '@miso.ai/doggoganger-api';

export default function buildApi(options) {
  return api({
    temporal: true,
    ...options,
  });
};
