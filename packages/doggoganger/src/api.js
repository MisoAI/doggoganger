import { Api } from '@miso.ai/doggoganger-api';

export default function buildApi(...args) {
  return new Api(...args);
};
