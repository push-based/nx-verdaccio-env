import { join } from 'node:path';

export const EXECUTOR_ENVIRONMENT_BOOTSTRAP = 'env-bootstrap';
export const VERDACCIO_REGISTRY_JSON = 'verdaccio-registry.json';
export const DEFAULT_VERDACCIO_STORAGE_DIR = join(
  'tmp',
  'local-registry',
  'storage'
);
