
import { assert, beforeAll, describe, test } from 'vitest';
import { apitestConfig } from '../lib/apitest-config';

const { EZD_API_BASE_URL } = apitestConfig;

describe('apitest tests', () => {
  beforeAll(() => {
    // globalThis.ezdCtx
  });
  test('tests health endpoint', async () => {
    let req = await fetch(`${EZD_API_BASE_URL}/health`);
    let body = await req.json();
    assert(body);
  });
});
