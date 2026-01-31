
import assert from 'node:assert';

import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { apitestConfig } from '../lib/apitest-config';
import { HttpClient } from '../lib/http-client';
import { authUtil } from '../lib/auth/auth-util';
import { userUtil } from '../lib/util/user-util';
import { EzdUser } from '../lib/models/ezd-user';
import { EzdRoleDto, EzdRoleSchema } from '../lib/models/ezd-role';
import { ezdPermissionSchema } from '../lib/models/ezd-permission';
import { datetimeUtil } from '../lib/util/datetime-util';

const { EZD_API_BASE_URL } = apitestConfig;
const username_suffix = 'authz';

const base_roles = [ 'Default', 'ServerAdmin', 'Test', 'NoPermissions' ];
const base_perms = [ 'user.basic', 'user.mgmt', 'permission.read', 'role.read' ];

describe('authz tests', () => {
  let hc: HttpClient;
  let apiJwt: string;
  let apiUser: EzdUser;
  let user1Name: string;
  let user1Email: string;
  let user1: EzdUser | undefined;

  let testCreateRoleName: string;
  let testCreateRole: EzdRoleDto | undefined;
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

    testCreateRoleName = `ApiTest_${datetimeUtil.alphaNumericDateTime()}`;
  });

  afterAll(async () => {
    /*
      clean up any test users, e.g. if the test ran but failed before/during delete
    _*/
    for(let i = 0; i < testUsers.length; i++) {
      await userUtil.deleteUser(testUsers[i]);
    }
  });

  test('get role by name', async () => {
    let testRoleName = 'Default';
    let usp = new URLSearchParams({
      name: testRoleName,
    });
    let url = `${EZD_API_BASE_URL}/v1/authz/role?${usp.toString()}`;
    let getRoleResp = await hc.withJwt(apiJwt).get(url);
    expect(getRoleResp.status).toBe(200);
    let rawResp = await getRoleResp.json();
    let role = EzdRoleSchema.decode(rawResp);
    expect(role.name).toBe(testRoleName);
  });

  test('get role by name with permissions', async () => {
    let testRoleName = 'Default';
    let usp = new URLSearchParams({
      name: testRoleName,
      permissions: 'true',
    });
    let url = `${EZD_API_BASE_URL}/v1/authz/role?${usp.toString()}`;
    let getRoleResp = await hc.withJwt(apiJwt).get(url);
    expect(getRoleResp.status).toBe(200);
    let rawResp = await getRoleResp.json();
    let role = EzdRoleSchema.decode(rawResp);
    expect(role.name).toBe(testRoleName);
    expect(role.permissions?.find(perm => perm.name === 'user.basic')).toBeDefined();
  });

  test('get roles', async () => {
    let url = `${EZD_API_BASE_URL}/v1/authz/role`;
    let getRolesResp = await hc.withJwt(apiJwt).get(url);
    expect(getRolesResp.status).toBe(200);
    let rawResp = await getRolesResp.json();
    assert(Array.isArray(rawResp));
    let roles = rawResp.map(EzdRoleSchema.decode);
    /*
      should include at least: Default, ServerAdmin, Test, NoPermissions
    */
    expect(roles.length).toBeGreaterThanOrEqual(base_roles.length);
    for(let i = 0; i < base_roles.length; i++) {
      expect(roles.find(role => role.name === base_roles[i])).toBeDefined();
    }
  });

  test('get roles with permissions', async () => {
    let usp = new URLSearchParams({
      permissions: 'true',
    });
    let url = `${EZD_API_BASE_URL}/v1/authz/role?${usp.toString()}`;
    let getRolesResp = await hc.withJwt(apiJwt).get(url);
    expect(getRolesResp.status).toBe(200);
    let rawResp = await getRolesResp.json();
    assert(Array.isArray(rawResp));
    let roles = rawResp.map(EzdRoleSchema.decode);
    expect(roles.length).toBeGreaterThanOrEqual(3);
    for(let i = 0; i < roles.length; i++) {
      expect(roles[i].permissions).toBeDefined();
    }
    let defaultRole = roles.find(role => role.name === 'Default')!;
    expect(defaultRole).toBeDefined();
    expect(defaultRole.permissions?.length).toBeGreaterThanOrEqual(2);
    expect(defaultRole.permissions?.find(perm => perm.name === 'user.basic')).toBeDefined();
    expect(defaultRole.permissions?.find(perm => perm.name === 'users.read')).toBeDefined();
    let noPermsRole = roles.find(role => role.name === 'NoPermissions')!;
    expect(noPermsRole).toBeDefined();
    expect(noPermsRole.permissions).toBeDefined();
    expect(noPermsRole.permissions?.length).toBe(0);
  });

  test('get roles as non-privileged user', async () => {
    assert(user1 !== undefined);
    let url = `${EZD_API_BASE_URL}/v1/authz/role`;
    let user1Jwt = authUtil.getJwt(user1.user_id);
    let getRolesResp = await hc.withJwt(user1Jwt).get(url);
    expect(getRolesResp.status).toBe(403);
  });

  test('create role', async () => {
    let url = `${EZD_API_BASE_URL}/v1/authz/role`;
    let createRoleResp = await hc.withJwt(apiJwt).post(url, {
      body: {
        name: testCreateRoleName,
      },
    });
    expect(createRoleResp.status).toBe(200);
    let rawResp = await createRoleResp.json();
    let role = EzdRoleDto.decode(rawResp);
    expect(role.role_name).toBe(testCreateRoleName);
    testCreateRole = role;
  });

  test('create role as non-privileged user', async () => {
    assert(user1 !== undefined);
    let user1Jwt = authUtil.getJwt(user1.user_id);
    let url = `${EZD_API_BASE_URL}/v1/authz/role`;
    let testRoleName = `ApiTest_noprivilege_${datetimeUtil.alphaNumericDateTime()}`;
    let createRoleResp = await hc.withJwt(user1Jwt).post(url, {
      body: {
        name: testRoleName,
      },
    });
    expect(createRoleResp.status).toBe(403);
  });

  test('delete role as non-privileged user', async () => {
    assert(user1 !== undefined);
    assert(testCreateRole !== undefined);
    let user1Jwt = authUtil.getJwt(user1.user_id);
    let url = `${EZD_API_BASE_URL}/v1/authz/role/${testCreateRole.role_id}`;
    let deleteRoleResp = await hc.withJwt(user1Jwt).delete(url);
    expect(deleteRoleResp.status).toBe(403);
  });

  test('delete role', async () => {
    assert(testCreateRole !== undefined);
    let url = `${EZD_API_BASE_URL}/v1/authz/role/${testCreateRole.role_id}`;
    let deleteRoleResp = await hc.withJwt(apiJwt).delete(url);
    expect(deleteRoleResp.status).toBe(200);
  });

  test('get permissions', async () => {
    let url = `${EZD_API_BASE_URL}/v1/authz/perm`;
    let getPermsResp = await hc.withJwt(apiJwt).get(url);
    expect(getPermsResp.status).toBe(200);
    let rawResp = await getPermsResp.json();
    assert(Array.isArray(rawResp));
    let perms = rawResp.map(ezdPermissionSchema.decode);
    for(let i = 0; i < base_perms.length; i++) {
      let permName = base_perms[i];
      let foundPerm = perms.find((perm) => perm.name === permName);
      expect(foundPerm, `Base permission: '${permName}'`).toBeDefined();
    }
  });
  test('get permission as non-privileged user', async () => {
    assert(user1 !== undefined);
    let user1Jwt = authUtil.getJwt(user1.user_id);
    let getPermsResp = await hc.withJwt(user1Jwt).get(`${EZD_API_BASE_URL}/v1/authz/perm`);
    expect(getPermsResp.status).toBe(403);
  });
});
