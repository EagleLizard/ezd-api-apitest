
import assert from 'node:assert';

import { beforeAll, describe, expect, test  } from 'vitest';

import { apitestConfig } from '../lib/apitest-config';
import { authUtil } from '../lib/auth/auth-util';
import { EzdUser } from '../lib/models/ezd-user';
import { prim } from '../lib/util/validate-primitives';
import { datetimeUtil } from '../lib/util/datetime-util';
import { EzdRoleSchema } from '../lib/models/ezd-role';

const { EZD_API_BASE_URL } = apitestConfig;

describe('user tests', () => {
  let jwt: string;
  let apiUser: EzdUser;
  let testRegisterUserName: string;
  let testRegisterUserEmail: string;
  let testRegisterUserPw: string;
  let registerTestUser: EzdUser | undefined;

  beforeAll(async () => {
    apiUser = globalThis.ezdCtx.apiUser;
    jwt = authUtil.getJwt(apiUser.user_id);

    let nowDtStr = datetimeUtil.alphaNumericDateTime();
    testRegisterUserName = `apitest_${nowDtStr}`;
    testRegisterUserEmail = `ezdapitest+${testRegisterUserName}@gmail.com`;
    testRegisterUserPw = `pw+${nowDtStr}`;

  });

  test('tests whoami', async () => {
    let url = `${EZD_API_BASE_URL}/v1/user/whoami`;
    let whoamiResp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      }
    });
    expect(whoamiResp.status).toBe(200);
    let respBody = await whoamiResp.json();
    assert(prim.isObject(respBody) && prim.isObject(respBody.user));
    expect(respBody.user.user_id).toBe(apiUser.user_id);
  });

  test('register new user', async () => {
    let url = `${EZD_API_BASE_URL}/v1/users/register`;
    let body = {
      userName: testRegisterUserName,
      email: testRegisterUserEmail,
      password: testRegisterUserPw,
    } as const;
    let registerResp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    expect(registerResp.status).toBe(200);
    let rawRespBody = await registerResp.json();
    assert(prim.isObject(rawRespBody) && prim.isObject(rawRespBody.user));
    registerTestUser = EzdUser.decode(rawRespBody.user);
    expect(registerTestUser.user_name).toBe(testRegisterUserName);
  });

  test('tests user login', async () => {
    assert(registerTestUser !== undefined);
    let url = `${EZD_API_BASE_URL}/v1/user/login`;
    let body = {
      userName: testRegisterUserName,
      password: testRegisterUserPw,
    } as const;
    let loginResp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    expect(loginResp.status).toBe(200);
    let rawRespBody = await loginResp.json();
    assert(prim.isObject(rawRespBody) && prim.isObject(rawRespBody.user));
    let rawUser = rawRespBody.user;
    expect(rawUser.user_name).toBe(body.userName);
  });

  test(`new user has 'Default' role only`, async () => {
    assert(registerTestUser !== undefined);
    let url = `${EZD_API_BASE_URL}/v1/user/${registerTestUser.user_id}/role`;
    let roleResp = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      }
    });
    expect(roleResp.status).toBe(200);
    let respBody = await roleResp.json();
    assert(Array.isArray(respBody));
    let roles = respBody.map(EzdRoleSchema.decode);
    expect(roles.length).toBe(1);
    expect(roles[0].name).toBe('Default');
  });

  test('assign role to user', async () => {
    assert(registerTestUser !== undefined);
    let testRoleName = 'Test';
    let url = `${EZD_API_BASE_URL}/v1/user/${registerTestUser.user_id}/role`;
    let body = {
      roles: [ testRoleName ],
    } as const;
    let addRoleResp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify(body),
    });
    expect(addRoleResp.status).toBe(200);
    let getRolesResp = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
    });
    expect(getRolesResp.status).toBe(200);
    let rawRespBody = await getRolesResp.json();
    assert(Array.isArray(rawRespBody));
    let foundRole = rawRespBody.find(rawRole => {
      return rawRole?.name === testRoleName;
    });
    expect(foundRole).toBeDefined();
    expect(foundRole?.name).toBe(testRoleName);
  });

  test('delete role from user', async () => {
    assert(registerTestUser !== undefined);
    let testRoleName = 'Test';
    let url = `${EZD_API_BASE_URL}/v1/user/${registerTestUser.user_id}/role/${testRoleName}`;
    let delRoleResp = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
    });
    expect(delRoleResp.status).toBe(200);
    url = `${EZD_API_BASE_URL}/v1/user/${registerTestUser.user_id}/role`;
    let getRolesResp = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
    });
    expect(getRolesResp.status).toBe(200);
    let rawRespBody = await getRolesResp.json();
    assert(Array.isArray(rawRespBody));
    let foundRole = rawRespBody.find(rawRole => {
      return rawRole?.name === testRoleName;
    });
    expect(foundRole).toBeUndefined();
  });

  test('tests delete user', async () => {
    assert(registerTestUser !== undefined);
    let getUserUrl = `${EZD_API_BASE_URL}/v1/user/${registerTestUser.user_name}`;
    let getUserResp = await fetch(getUserUrl, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
    });
    expect(getUserResp.status).toBe(200);
    let getUserRawResp = await getUserResp.json();
    assert(prim.isObject(getUserRawResp) && prim.isObject(getUserRawResp.user));
    expect(getUserRawResp.user.user_name).toBe(registerTestUser.user_name);
    let url = `${EZD_API_BASE_URL}/v1/user/${registerTestUser.user_id}`;
    let resp = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwt}`,
      }
    });
    expect(resp.status).toBe(200);
    getUserResp = await fetch(getUserUrl, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
    });
    expect(getUserResp.status).toBe(404);
  });
});
