
import assert from 'node:assert';
import { describe, beforeEach, beforeAll, test, expect, afterEach } from 'vitest';
import { HttpClient } from '../../lib/http-client';
import { authUtil } from '../../lib/auth/auth-util';
import { EzdUser } from '../../lib/models/ezd-user';
import { apitestConfig } from '../../lib/apitest-config';
import { prim } from '../../lib/util/validate-primitives';
import { jcdConf } from '../../lib/config/jcd-config';
import { JcdV3ProjKeyDto } from '../../lib/models/jcd/jcd-v3-proj-key-dto';
import { GcpKeyDto } from '../../lib/models/gcp/gcp-key-dto';

const { EZD_API_BASE_URL } = apitestConfig;

describe('jcd-env tests', () => {
  let hc: HttpClient;
  let apiJwt: string;
  let apiUser: EzdUser;
  const projectsToClean: [env: string, projKey: string][] = [];

  let jcd_env: string;
  beforeEach(() => {
    hc = HttpClient.init().withJwt(apiJwt);
    jcd_env = jcdConf.default_env_id;
  });

  beforeAll(async () => {
    apiUser = globalThis.ezdCtx.apiUser;
    apiJwt = authUtil.getJwt(apiUser.user_id);
  });
  afterEach(async () => {
    hc = HttpClient.init().withJwt(apiJwt);
    for(let i = 0; i < projectsToClean.length; i++) {
      let [ envKey, projKey ] = projectsToClean[i];
      await deleteProj(envKey, projKey);
    }
    projectsToClean.length = 0;
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

  test('tests get env proj v3 keys', async () => {
    let url = `${EZD_API_BASE_URL}/v1/jcd/env/${jcd_env}/proj`;
    let resp = await hc.get(url);
    expect(resp.status).toBe(200);
    let body = await resp.json();
    assert(prim.arr(body));
    expect(body.length).greaterThan(0);
    body.forEach(projKey => {
      assert(prim.obj(projKey));
      expect(prim.str(projKey.projectKey)).toBe(true);
      expect(prim.bool(projKey.active)).toBe(true);
    });
  });

  test('post env v3 proj copy fails when copying to default env',  async () => {
    let mock_env = 'apitest_fake_env';
    let mock_proj_key = 'fake_proj';
    let url = `${EZD_API_BASE_URL}/v1/jcd/env/${mock_env}/proj/${mock_proj_key}/copy/${jcd_env}`;
    let resp = await hc.post(url, { body: '' });
    expect(resp.status).toBe(403);
    let body = await resp.json();
    assert(prim.obj(body));
    assert(prim.str(body.errMsg));
    expect(body.errMsg).toContain('default');
  });

  test('post env v3 proj copy fails when copying env to self',  async () => {
    let mock_env = 'apitest_fake_env';
    let mock_proj_key = 'fake_proj';
    let url = `${EZD_API_BASE_URL}/v1/jcd/env/${mock_env}/proj/${mock_proj_key}/copy/${mock_env}`;
    let resp = await hc.post(url, { body: '' });
    expect(resp.status).toBe(403);
    let body = await resp.json();
    assert(prim.obj(body));
    assert(prim.str(body.errMsg));
    expect(body.errMsg).toContain('itself');
  });

  test('post env v3 proj copy',  async () => {
    let mock_dest_env = 'apitest_env';
    let projKeys = await getV3ProjKeys();
    assert(projKeys.length > 1);
    let projKey = projKeys[1];
    let mock_proj_key = projKey.projectKey;
    projectsToClean.push([ mock_dest_env, mock_proj_key ]);
    let url = `${
      EZD_API_BASE_URL
    }/v1/jcd/env/${jcd_env}/proj/${mock_proj_key}/copy/${mock_dest_env}`;
    let resp = await hc.post(url, { body: '' });
    expect(resp.status).toBe(200);
    let body = await resp.json();
    assert(prim.obj(body));
    assert(prim.obj(body.ops));
    assert(prim.arr(body.ops.inserted));
    expect(body.ops.inserted.length > 0);
  });

  test('post env v3 proj delete without img flag preserves images',  async () => {
    /* first, copy project to test _*/
    let mock_dest_env = 'apitest_env';
    let projKeys = await getV3ProjKeys();
    assert(projKeys.length > 3);
    let projKey = projKeys[3];
    let mock_proj_key = projKey.projectKey;
    projectsToClean.push([ mock_dest_env, mock_proj_key ]);
    let url = `${
      EZD_API_BASE_URL
    }/v1/jcd/env/${jcd_env}/proj/${mock_proj_key}/copy/${mock_dest_env}`;
    let resp = await hc.post(url, { body: '' });
    expect(resp.status).toBe(200);
    let body = await resp.json();
    assert(prim.obj(body));
    assert(prim.obj(body.ops));
    assert(prim.arr(body.ops.inserted));
    expect(body.ops.inserted.length).greaterThan(0);
    assert(prim.arr(body.ops.skipped));
    expect(body.ops.skipped.length).toBe(0);
    let delUrl = `${EZD_API_BASE_URL}/v1/jcd/env/${mock_dest_env}/proj/${mock_proj_key}`;
    resp = await hc.delete(delUrl);
    expect(resp.status).toBe(200);
    resp = await hc.post(url, { body: '' });
    expect(resp.status).toBe(200);
    body = await resp.json();
    assert(prim.obj(body));
    assert(prim.obj(body.ops));
    assert(prim.arr(body.ops.inserted));
    expect(body.ops.inserted.length).greaterThan(0);
    let insertedImages = body.ops.inserted.filter(rawKey => {
      return GcpKeyDto.decode(rawKey).kind === jcdConf.jcd_v3_kinds.img;
    });
    expect(insertedImages.length).toBe(0);
    assert(prim.arr(body.ops.skipped));
    expect(body.ops.skipped.length).greaterThan(0);
    let skippedGcpKeyDtos = body.ops.skipped.map(GcpKeyDto.decode);
    expect(skippedGcpKeyDtos.every(key => {
      return key.kind === jcdConf.jcd_v3_kinds.img;
    })).toBe(true);
  });

  async function getV3ProjKeys(env = jcd_env): Promise<JcdV3ProjKeyDto[]>{
    let url = `${EZD_API_BASE_URL}/v1/jcd/env/${env}/proj`;
    let resp = await hc.get(url);
    assert(resp.status === 200);
    let body = await resp.json();
    assert(prim.arr(body));
    let parsed = body.map(JcdV3ProjKeyDto.decode);
    return parsed;
  }

  async function deleteProj(envKey: string, projKey: string) {
    let hc = HttpClient.init().withJwt(apiJwt);
    let url = `${EZD_API_BASE_URL}/v1/jcd/env/${envKey}/proj/${projKey}`;
    let resp = await hc.delete(url, { qs: { img: true } });
    if(resp.status !== 200) {
      let body = await resp.json();
      console.error(body);
    }
  }
});
