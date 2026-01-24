
import assert from 'node:assert';

import { afterAll, beforeAll, describe, expect, test  } from 'vitest';

import { apitestConfig } from '../lib/apitest-config';
import { authUtil } from '../lib/auth/auth-util';
import { EzdUser } from '../lib/models/ezd-user';
import { prim } from '../lib/util/validate-primitives';
import { datetimeUtil } from '../lib/util/datetime-util';
import { EzdRoleSchema } from '../lib/models/ezd-role';
import { EzdError } from '../lib/error/ezd-error';
import { ezdPermissionSchema } from '../lib/models/ezd-permission';

const { EZD_API_BASE_URL } = apitestConfig;

describe('user tests', () => {
  let apitestJwt: string;
  let apiUser: EzdUser;
  let registerUserName: string;
  let registerUserEmail: string;
  let registerUserPw: string;
  let registerUser: EzdUser | undefined;
  let user1Name: string;
  let user1Email: string;
  let user1: EzdUser | undefined;
  /* cleanup _*/
  let testUsers: EzdUser[] = [];

  beforeAll(async () => {
    apiUser = globalThis.ezdCtx.apiUser;
    apitestJwt = authUtil.getJwt(apiUser.user_id);

    let nowDtStr = datetimeUtil.alphaNumericDateTime();
    registerUserName = `apitest_${nowDtStr}`;
    registerUserEmail = `ezdapitest+${registerUserName}@gmail.com`;
    registerUserPw = `pw+${nowDtStr}`;

    user1Name = `apitest_${nowDtStr}_2`;
    user1Email = `ezdapitest+${user1Name}@gmail.com`;

    let url = `${EZD_API_BASE_URL}/v1/user`;
    let createUserResp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apitestJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName: user1Name,
        email: user1Email,
      }),
    });
    if(createUserResp.status !== 200) {
      throw new EzdError(`Error creating user, username: ${user1Name}`, 'EAT_1.2');
    }
    let rawResp = await createUserResp.json();
    user1 = EzdUser.decode(rawResp);
    testUsers.push(user1);
  });

  afterAll(async () => {
    /*
    clean up any test users, e.g. if the test ran but failed before/during delete
    _*/
    for(let i = 0; i < testUsers.length; i++) {
      let testUser = testUsers[i];
      console.log(`cleaning up test user: ${testUser.user_name}`);
      let getUserResp = await fetch(`${EZD_API_BASE_URL}/v1/user/${testUser.user_name}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apitestJwt}`,
        },
      });
      if(getUserResp.status !== 200 && getUserResp.status !== 404) {
        throw new EzdError(`${
          getUserResp.status
        } - Failed to get test user during cleanup, name: '${
          testUser.user_name
        }', id: ${testUser.user_id}`, 'EAT_1.3');
      }
      if(getUserResp.status === 200) {
        /* delete */
        let delResp = await fetch(`${EZD_API_BASE_URL}/v1/user/${testUser.user_id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${apitestJwt}`,
          },
        });
        if(delResp.status !== 200) {
          throw new EzdError(`${
            delResp.status
          } - Failed to delete test user during cleanup, name: '${
            testUser.user_name
          }', id: ${testUser.user_id}`);
        }
      }
    }
  });

  test('tests whoami', async () => {
    let url = `${EZD_API_BASE_URL}/v1/user/whoami`;
    let whoamiResp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apitestJwt}`,
      }
    });
    expect(whoamiResp.status).toBe(200);
    let respBody = await whoamiResp.json();
    assert(prim.isObject(respBody) && prim.isObject(respBody.user));
    expect(respBody.user.user_id).toBe(apiUser.user_id);
  });

  test('tests get users with name param returns user with name', async () => {
    assert(user1 !== undefined);
    let qsp = new URLSearchParams({
      name: user1.user_name,
    });
    let url = `${EZD_API_BASE_URL}/v1/user?${qsp.toString()}`;
    let getUserResp = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apitestJwt}`,
      }
    });
    expect(getUserResp.status).toBe(200);
    let rawResp = await getUserResp.json();
    assert(prim.isObject(rawResp));
    let user = EzdUser.decode(rawResp.user);
    expect(user.user_id).toBe(user1.user_id);
    expect(user.user_name).toBe(user1.user_name);
  });

  test('register new user', async () => {
    let url = `${EZD_API_BASE_URL}/v1/users/register`;
    let body = {
      userName: registerUserName,
      email: registerUserEmail,
      password: registerUserPw,
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
    registerUser = EzdUser.decode(rawRespBody.user);
    testUsers.push(registerUser);
    expect(registerUser.user_name).toBe(registerUserName);
  });
  test('get user as self includes roles and permissions', async () => {
    assert(user1 !== undefined);
    let testUserJwt = authUtil.getJwt(user1.user_id);
    let usp = new URLSearchParams({
      name: user1.user_name,
    });
    let url = `${EZD_API_BASE_URL}/v1/user?${usp.toString()}`;
    let getUserResp = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserJwt}`,
      }
    });
    expect(getUserResp.status).toBe(200);
    let getUserRawResp = await getUserResp.json();
    assert(prim.isObject(getUserRawResp));
    assert(Array.isArray(getUserRawResp.roles));
    let userRoles = getUserRawResp.roles.map(EzdRoleSchema.decode);
    let defaultRole = userRoles.find(userRole => userRole.name === 'Default');
    expect(defaultRole).toBeDefined();
    assert(Array.isArray(getUserRawResp.permissions));
    let userPermissions = getUserRawResp.permissions.map(ezdPermissionSchema.decode);
    let basicPermission = userPermissions.find(userPerm => userPerm.name === 'user.basic');
    expect(basicPermission).toBeDefined();
  });

  test('tests user login', async () => {
    assert(registerUser !== undefined);
    let url = `${EZD_API_BASE_URL}/v1/user/login`;
    let body = {
      userName: registerUser.user_name,
      password: registerUserPw,
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
    assert(user1 !== undefined);
    let url = `${EZD_API_BASE_URL}/v1/user/${user1.user_id}/role`;
    let roleResp = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apitestJwt}`,
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
    assert(user1 !== undefined);
    let testRoleName = 'Test';
    let url = `${EZD_API_BASE_URL}/v1/user/${user1.user_id}/role`;
    let body = {
      roles: [ testRoleName ],
    } as const;
    let addRoleResp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apitestJwt}`,
      },
      body: JSON.stringify(body),
    });
    expect(addRoleResp.status).toBe(200);
    let getRolesResp = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apitestJwt}`,
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

  test('list user permissions', async () => {
    assert(user1 !== undefined);
    let url = `${EZD_API_BASE_URL}/v1/user/${user1.user_id}/permission`;
    let getPermissionsResp = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apitestJwt}`,
      },
    });
    expect(getPermissionsResp.status).toBe(200);
    let rawRespBody = await getPermissionsResp.json();
    assert(Array.isArray(rawRespBody) && rawRespBody.every(prim.isObject));
    expect(rawRespBody.find((rawPerm) => {
      return rawPerm.name === 'user.basic';
    })).toBeDefined();
    expect(rawRespBody.find((rawPerm) => {
      return rawPerm.name === 'test.read';
    })).toBeDefined();
  });

  test('delete role from user', async () => {
    assert(user1 !== undefined);
    let testRoleName = 'Test';
    let url = `${EZD_API_BASE_URL}/v1/user/${user1.user_id}/role/${testRoleName}`;
    let delRoleResp = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apitestJwt}`,
      },
    });
    expect(delRoleResp.status).toBe(200);
    url = `${EZD_API_BASE_URL}/v1/user/${user1.user_id}/role`;
    let getRolesResp = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apitestJwt}`,
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
    assert(user1 !== undefined);
    let url = `${EZD_API_BASE_URL}/v1/user/${user1.user_id}`;
    let resp = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apitestJwt}`,
      }
    });
    expect(resp.status).toBe(200);
    let usp = new URLSearchParams({
      name: user1.user_name,
    });
    let getUserUrl = `${EZD_API_BASE_URL}/v1/user?${usp.toString()}`;
    let getUserResp = await fetch(getUserUrl, {
      headers: {
        'Authorization': `Bearer ${apitestJwt}`,
      },
    });
    expect(getUserResp.status).toBe(404);
  });
});
