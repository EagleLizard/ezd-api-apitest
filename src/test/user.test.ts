
import assert from 'node:assert';

import { afterAll, beforeAll, beforeEach, describe, expect, test  } from 'vitest';

import { apitestConfig } from '../lib/apitest-config';
import { authUtil } from '../lib/auth/auth-util';
import { EzdUser } from '../lib/models/ezd-user';
import { prim } from '../lib/util/validate-primitives';
import { EzdRoleSchema } from '../lib/models/ezd-role';
import { ezdPermissionSchema } from '../lib/models/ezd-permission';
import { HttpClient } from '../lib/http-client';
import { userUtil } from '../lib/util/user-util';

const { EZD_API_BASE_URL } = apitestConfig;
const username_suffix = 'user';

describe('user tests', () => {
  let hc: HttpClient;
  let apiJwt: string;
  let apiUser: EzdUser;
  let user1Name: string;
  let user1Email: string;
  let user1: EzdUser | undefined;
  /* cleanup _*/
  let testUsers: EzdUser[] = [];

  beforeEach(() => {
    hc = HttpClient.init();
  });

  beforeAll(async () => {
    apiUser = globalThis.ezdCtx.apiUser;
    apiJwt = authUtil.getJwt(apiUser.user_id);
    hc ??= HttpClient.init().withJwt(apiJwt);

    user1Name = userUtil.getTestUsername(username_suffix);
    user1Email = `ezdapitest+${user1Name}@gmail.com`;

    user1 = await userUtil.createUser(user1Name, user1Email);
    testUsers.push(user1);
  });

  afterAll(async () => {
    /*
      clean up any test users, e.g. if the test ran but failed before/during delete
    _*/
    for(let i = 0; i < testUsers.length; i++) {
      await userUtil.deleteUser(testUsers[i]);
    }
  });

  test('tests whoami', async () => {
    let url = `${EZD_API_BASE_URL}/v1/user/whoami`;
    let whoamiResp = await hc.withJwt(apiJwt).get(url);
    expect(whoamiResp.status).toBe(200);
    let respBody = await whoamiResp.json();
    assert(prim.isObject(respBody) && prim.isObject(respBody.user));
    expect(respBody.user.user_id).toBe(apiUser.user_id);
  });

  test('get users returns user list', async () => {
    let getUserResp = await hc.withJwt(apiJwt).get(`${EZD_API_BASE_URL}/v1/user`);
    expect(getUserResp.status).toBe(200);
    let rawResp = await getUserResp.json();
    assert(Array.isArray(rawResp) && rawResp.every(prim.isObject));
    for(let i = 0; i < rawResp.length; i++) {
      expect(rawResp[i].user).toBeDefined();
      expect(rawResp[i].permissions).toBeUndefined();
      expect(rawResp[i].roles).toBeUndefined();
    }
  });

  test('get user with permissions has permissions', async () => {
    assert(user1 !== undefined);
    let qsp = new URLSearchParams({
      name: user1.user_name,
      permissions: 'true',
    });
    let getUserResp = await hc.withJwt(apiJwt)
      .get(`${EZD_API_BASE_URL}/v1/user?${qsp.toString()}`);
    expect(getUserResp.status).toBe(200);
    let rawResp = await getUserResp.json();
    assert(prim.isObject(rawResp));
    expect(rawResp.permissions).toBeDefined();
    expect(rawResp.roles).toBeUndefined();
    assert(Array.isArray(rawResp.permissions));
    let permissions = rawResp.permissions.map(ezdPermissionSchema.decode);
    expect(permissions.find((perm => perm.name === 'user.basic'))).toBeDefined();
    expect(permissions.find((perm => perm.name === 'user.mgmt'))).toBeUndefined();
  });

  test('get user with roles has roles', async () => {
    assert(user1 !== undefined);
    let qsp = new URLSearchParams({
      name: user1.user_name,
      roles: 'true',
    });
    let getUserResp = await hc.withJwt(apiJwt)
      .get(`${EZD_API_BASE_URL}/v1/user?${qsp.toString()}`);
    expect(getUserResp.status).toBe(200);
    let rawResp = await getUserResp.json();
    assert(prim.isObject(rawResp));
    expect(rawResp.permissions).toBeUndefined();
    expect(rawResp.roles).toBeDefined();
    assert(Array.isArray(rawResp.roles));
    let roles = rawResp.roles.map(EzdRoleSchema.decode);
    expect(roles.find((perm => perm.name === 'Default'))).toBeDefined();
    expect(roles.find((perm => perm.name === 'ServerAdmin'))).toBeUndefined();
  });

  test('get users returns users without roles/permissions for non-privileged user', async () => {
    assert(user1 !== undefined);
    let qsp = new URLSearchParams({
      roles: 'true',
      permissions: 'true',
    });
    let user1Jwt = authUtil.getJwt(user1.user_id);
    let getUsersResp = await hc.withJwt(user1Jwt)
      .get(`${EZD_API_BASE_URL}/v1/user?${qsp.toString()}`);
    expect(getUsersResp.status).toBe(200);
    let rawResp = await getUsersResp.json();
    assert(Array.isArray(rawResp) && rawResp.every(prim.isObject));
    for(let i = 0; i < rawResp.length; i++) {
      let respItem = rawResp[i];
      expect(respItem.user).toBeDefined();
      expect(respItem.permissions).toBeUndefined();
      expect(respItem.roles).toBeUndefined();
    }
  });

  test('get user returns roles without permissions', async () => {
    let qsp = new URLSearchParams({
      name: apiUser.user_name,
      roles: 'true',
    });
    let url = `${EZD_API_BASE_URL}/v1/user?${qsp.toString()}`;

    let getUsersResp = await hc.withJwt(apiJwt).get(url);
    expect(getUsersResp.status).toBe(200);
    let rawResp = await getUsersResp.json();
    assert(prim.isObject(rawResp) && Array.isArray(rawResp.roles));
    let roles = rawResp.roles.map(EzdRoleSchema.decode);
    expect(roles.find(role => role.name === 'NoPermissions')).toBeDefined();
  });

  test('get users returns roles without permissions', async () => {
    let qsp = new URLSearchParams({ roles: 'true' });
    let url = `${EZD_API_BASE_URL}/v1/user?${qsp.toString()}`;

    let getUsersResp = await hc.withJwt(apiJwt).get(url);
    expect(getUsersResp.status).toBe(200);
    let rawResp = await getUsersResp.json();
    assert(Array.isArray(rawResp) && rawResp.every(prim.isObject));
    let apiUserRespItem = rawResp.find((respItem) => {
      return prim.isObject(respItem.user) && respItem.user.user_id === apiUser.user_id;
    });
    assert(apiUserRespItem !== undefined);
    assert(Array.isArray(apiUserRespItem.roles));
    let apiUserRoles = apiUserRespItem.roles.map(EzdRoleSchema.decode);
    expect(apiUserRoles.find(role => role.name === 'NoPermissions')).toBeDefined();
  });

  test('tests get users with name param returns user with name', async () => {
    assert(user1 !== undefined);
    let qsp = new URLSearchParams({
      name: user1.user_name,
    });
    let url = `${EZD_API_BASE_URL}/v1/user?${qsp.toString()}`;
    let getUserResp = await hc.withJwt(apiJwt).get(url);
    expect(getUserResp.status).toBe(200);
    let rawResp = await getUserResp.json();
    assert(prim.isObject(rawResp));
    let user = EzdUser.decode(rawResp.user);
    expect(user.user_id).toBe(user1.user_id);
    expect(user.user_name).toBe(user1.user_name);
  });

  test('get user as self includes roles and permissions', async () => {
    assert(user1 !== undefined);
    let testUserJwt = authUtil.getJwt(user1.user_id);
    let usp = new URLSearchParams({
      name: user1.user_name,
      permissions: 'true',
      roles: 'true',
    });
    let url = `${EZD_API_BASE_URL}/v1/user?${usp.toString()}`;
    let getUserResp = await hc.withJwt(testUserJwt).get(url);
    expect(getUserResp.status).toBe(200);
    let getUserRawResp = await getUserResp.json();
    assert(prim.isObject(getUserRawResp) && Array.isArray(getUserRawResp.roles));
    let userRoles = getUserRawResp.roles.map(EzdRoleSchema.decode);
    expect(userRoles.find(userRole => userRole.name === 'Default')).toBeDefined();
    assert(Array.isArray(getUserRawResp.permissions));
    let userPermissions = getUserRawResp.permissions.map(ezdPermissionSchema.decode);
    expect(userPermissions.find(userPerm => userPerm.name === 'user.basic')).toBeDefined();
  });

  test(`new user has 'Default' role only`, async () => {
    assert(user1 !== undefined);
    let url = `${EZD_API_BASE_URL}/v1/user/${user1.user_id}/role`;
    let roleResp = await hc.withJwt(apiJwt).get(url);
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
    let addRoleResp = await hc.withJwt(apiJwt).post(url, {
      body: {
        roles: [ testRoleName ],
      },
    });
    expect(addRoleResp.status).toBe(200);
    let getRolesResp = await hc.withJwt(apiJwt).get(url);
    expect(getRolesResp.status).toBe(200);
    let rawRespBody = await getRolesResp.json();
    assert(Array.isArray(rawRespBody) && rawRespBody.every(prim.isObject));
    let foundRole = rawRespBody.find(rawRole => {
      return rawRole.name === testRoleName;
    });
    expect(foundRole).toBeDefined();
    expect(foundRole?.name).toBe(testRoleName);
  });

  test('list user permissions', async () => {
    assert(user1 !== undefined);
    let url = `${EZD_API_BASE_URL}/v1/user/${user1.user_id}/permission`;
    let getPermissionsResp = await hc.withJwt(apiJwt).get(url);
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
    let delRoleResp = await hc.withJwt(apiJwt).delete(url);
    expect(delRoleResp.status).toBe(200);
    url = `${EZD_API_BASE_URL}/v1/user/${user1.user_id}/role`;
    let getRolesResp = await hc.withJwt(apiJwt).get(url);
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
    let resp = await hc.withJwt(apiJwt).delete(`${EZD_API_BASE_URL}/v1/user/${user1.user_id}`);
    expect(resp.status).toBe(200);
    let usp = new URLSearchParams({
      name: user1.user_name,
    });
    let getUserResp = await hc.withJwt(apiJwt).get(`${EZD_API_BASE_URL}/v1/user?${usp.toString()}`);
    expect(getUserResp.status).toBe(400);
  });
});
