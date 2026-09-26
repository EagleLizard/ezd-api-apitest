
import assert from 'node:assert';
import { describe, beforeEach, beforeAll, test, expect } from 'vitest';
import { HttpClient } from '../../lib/http-client';
import { authUtil } from '../../lib/auth/auth-util';
import { EzdUser } from '../../lib/models/ezd-user';
import { apitestConfig } from '../../lib/apitest-config';
import { prim } from '../../lib/util/validate-primitives';
import { jcdConf } from '../../lib/config/jcd-config';

const { EZD_API_BASE_URL } = apitestConfig;

describe('jcd-env tests', () => {
  let hc: HttpClient;
  let apiJwt: string;
  let apiUser: EzdUser;

  let jcd_env: string;
  beforeEach(() => {
    hc = HttpClient.init().withJwt(apiJwt);
    jcd_env = jcdConf.default_env_id;
  });

  beforeAll(async () => {
    apiUser = globalThis.ezdCtx.apiUser;
    apiJwt = authUtil.getJwt(apiUser.user_id);
  });

  test('tests get envs', async () => {
    let url = `${EZD_API_BASE_URL}/v1/jcd/env`;
    let resp = await hc.get(url);
    expect(resp.status).toBe(200);
  });

  test('tests get env kinds', async () => {
    let url = `${EZD_API_BASE_URL}/v1/jcd/env/${jcd_env}/kind`;
    let resp = await hc.get(url);
    expect(resp.status).toBe(200);
    let body = await resp.json();
    assert(prim.arr(body));
    assert(body.every(prim.isObject));
    expect(body.length).greaterThan(0);
    body.forEach(rawKind => {
      expect(prim.isString(rawKind.name)).toBe(true);
    });
  });

  test('tests get env kind entities', async () => {
    let url = `${EZD_API_BASE_URL}/v1/jcd/env/${jcd_env}/kind`;
    let resp = await hc.get(url);
    expect(resp.status).toBe(200);
    let body = await resp.json();
    assert(prim.arr(body));
    assert(body.every(prim.isObject));
    assert(body.every(val => prim.isString(val.name)));
    let ekind = body.find(val => val.name === 'JcdProjectKeyV3');
    assert(ekind !== undefined);
    url = `${EZD_API_BASE_URL}/v1/jcd/env/${jcd_env}/kind/${ekind.name}`;
    resp = await hc.get(url);
    expect(resp.status).toBe(200);
    body = await resp.json();
    assert(prim.arr(body));
    expect(body.length).greaterThan(0);
    body.forEach(kindEntity => {
      assert(prim.isObject(kindEntity));
      expect(prim.isString(kindEntity.kind)).toBe(true);
      expect(prim.isString(kindEntity.name)).toBe(true);
    });
  });

  async function getProjectPreviews(env: string = jcdConf.default_env_id) {
    let usp = new URLSearchParams({ env: env, preview: 'true' });
    let url = `${EZD_API_BASE_URL}/v1/jcd/project?${usp.toString()}`;
    let resp = await hc.get(url);
    assert(resp.status === 200);
    let body = await resp.json();
    assert(prim.arr(body));
    assert(body.every(prim.isObject));
    return body;
  }
});

