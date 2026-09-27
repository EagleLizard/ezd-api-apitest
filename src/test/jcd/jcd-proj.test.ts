
import assert from 'node:assert';
import { describe, beforeEach, beforeAll, test, expect } from 'vitest';
import { HttpClient } from '../../lib/http-client';
import { authUtil } from '../../lib/auth/auth-util';
import { EzdUser } from '../../lib/models/ezd-user';
import { apitestConfig } from '../../lib/apitest-config';
import { prim } from '../../lib/util/validate-primitives';
import { jcdConf } from '../../lib/config/jcd-config';

const { EZD_API_BASE_URL } = apitestConfig;

describe('jcd-proj tests', () => {
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

  test('get projects', async () => {
    let url = `${EZD_API_BASE_URL}/v1/jcd/project`;
    let resp = await hc.get(url, { qs: { env: jcd_env } });
    expect(resp.status).toBe(200);
    let rawBody = await resp.json();
    assert(Array.isArray(rawBody));
    rawBody.forEach((rawProj) => {
      assert(prim.isObject(rawProj));
      expect(prim.isString(rawProj.projectKey)).toBe(true);
      expect(prim.arr(rawProj.playwright)).toBe(true);
      expect(prim.arr(rawProj.description)).toBe(true);
      expect(prim.arr(rawProj.productionCredits)).toBe(true);
      expect(prim.arr(rawProj.mediaAndPress)).toBe(true);
    });
  });
  test('get project previews', async () => {
    let url = `${EZD_API_BASE_URL}/v1/jcd/project`;
    let resp = await hc.get(url, { qs: { env: jcd_env, preview: true }});
    expect(resp.status).toBe(200);
    let rawBody = await resp.json();
    assert(prim.arr(rawBody));
    rawBody.forEach((rawProjPrev) => {
      assert(prim.isObject(rawProjPrev));
      expect(prim.isString(rawProjPrev.projectKey)).toBe(true);
      expect(prim.isString(rawProjPrev.route)).toBe(true);
    });
  });
  test('get project by route', async () => {
    let previewsUrl = `${EZD_API_BASE_URL}/v1/jcd/project`;
    let previewsResp = await hc.get(previewsUrl, { qs: { env: jcd_env, preview: true } });
    expect(previewsResp.status).toBe(200);
    let rawPreviewsBody = await previewsResp.json();
    assert(prim.arr(rawPreviewsBody));
    assert(prim.isObject(rawPreviewsBody[0]));
    let projPrev = rawPreviewsBody[0];
    assert(prim.isString(projPrev.route));
    let projRoute = projPrev.route;

    let url = `${EZD_API_BASE_URL}/v1/jcd/project`;
    let resp = await hc.get(url, { qs: { env: jcd_env, route: projRoute } });
    expect(resp.status).toBe(200);
    let body = await resp.json();
    assert(prim.isObject(body));
    expect(body.route).toBe(projRoute);
    expect(prim.isString(body.producer)).toBe(true);
  });
});

async function getProjectPreviews(env?: string) {

}
