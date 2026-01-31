
import assert from 'node:assert';

import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { apitestConfig } from '../lib/apitest-config';
import { EzdUser } from '../lib/models/ezd-user';
import { HttpClient } from '../lib/http-client';
import { authUtil } from '../lib/auth/auth-util';
import { prim } from '../lib/util/validate-primitives';
import { userUtil } from '../lib/util/user-util';

const { EZD_API_BASE_URL } = apitestConfig;

const uname_suffix = 'auth';

describe('auth tests', () => {
  let hc: HttpClient;
  let apiJwt: string;
  let apiUser: EzdUser;

  let registerUserName: string;
  let registerUserEmail: string;
  let registerUserPw: string;
  let registerUser: EzdUser | undefined;
  let nextRegisterUserPw: string | undefined;
  let user1Name: string;
  let user1Email: string;
  let user1: EzdUser | undefined;
  let user1Pw: string | undefined;
  let user1NextPw: string | undefined;
  let user2Name: string;
  let user2Email: string;
  let user2: EzdUser | undefined;

  /* cleanup _*/
  let testUsers: EzdUser[] = [];

  beforeEach(() => {
    hc = HttpClient.init();
  });

  beforeAll(async () => {
    let b4AllStart = process.hrtime.bigint();
    apiUser = globalThis.ezdCtx.apiUser;
    apiJwt = authUtil.getJwt(apiUser.user_id);
    hc = HttpClient.init().withJwt(apiJwt);

    registerUserName = userUtil.getTestUsername(uname_suffix);
    registerUserEmail = `ezdapitest+${registerUserName}@gmail.com`;
    registerUserPw = userUtil.getTestPw();

    user1Name = userUtil.getTestUsername(uname_suffix);
    user1Email = `ezdapitest+${user1Name}@gmail.com`;
    user2Name = userUtil.getTestUsername(uname_suffix);
    user2Email = `ezdapitest+${user2Name}@gmail.com`;

    user1 = await userUtil.createUser(user1Name, user1Email);
    user2 = await userUtil.createUser(user2Name, user2Email);
    testUsers.push(user1);
    testUsers.push(user2);

    let b4AllEnd = process.hrtime.bigint();
    let b4AllElapsedMs = Number(b4AllEnd - b4AllStart) / 1e6;
    console.log(`beforeAll took: ${b4AllElapsedMs} ms`);
  });

  afterAll(async () => {
    /*
      clean up any test users, e.g. if the test ran but failed before/during delete
    _*/
    for(let i = 0; i < testUsers.length; i++) {
      await userUtil.deleteUser(testUsers[i]);
    }
  });

  describe('user registration', () => {

    test('register new user', async () => {
      let url = `${EZD_API_BASE_URL}/v1/users/register`;
      let registerResp = await hc.post(url, {
        body: {
          userName: registerUserName,
          email: registerUserEmail,
          password: registerUserPw,
        }
      });
      expect(registerResp.status).toBe(200);
      let rawRespBody = await registerResp.json();
      assert(prim.isObject(rawRespBody) && prim.isObject(rawRespBody.user));
      registerUser = EzdUser.decode(rawRespBody.user);
      testUsers.push(registerUser);
      expect(registerUser.user_name).toBe(registerUserName);
    });

    test('tests user login', async () => {
      assert(registerUser !== undefined);
      let body = {
        userName: registerUser.user_name,
        password: registerUserPw,
      } as const;
      let loginResp = await hc.post(`${EZD_API_BASE_URL}/v1/user/login`, { body });
      expect(loginResp.status).toBe(200);
      let rawRespBody = await loginResp.json();
      assert(prim.isObject(rawRespBody) && prim.isObject(rawRespBody.user));
      let rawUser = rawRespBody.user;
      expect(rawUser.user_name).toBe(body.userName);
    });

    test('tests user can change password as self', async () => {
      assert(registerUser !== undefined);
      let userJwt = authUtil.getJwt(registerUser.user_id);
      nextRegisterUserPw = userUtil.getTestPw();
      assert(nextRegisterUserPw !== registerUserPw);
      let changePwRes = await hc.withJwt(userJwt)
        .post(`${EZD_API_BASE_URL}/v1/user/${registerUser.user_id}/pw`, {
          body: {
            password: registerUserPw,
            nextPassword: nextRegisterUserPw,
          }
        });
      if(changePwRes.status !== 200) {
        console.log(await changePwRes.json());
      }
      expect(changePwRes.status).toBe(200);
      registerUserPw = nextRegisterUserPw;
      nextRegisterUserPw = undefined;
    });

    test('error when user changes password as self with wrong current password', async () => {
      assert(registerUser !== undefined);
      nextRegisterUserPw = userUtil.getTestPw();
      assert(nextRegisterUserPw !== registerUserPw);
      let changePwRes = await hc.withJwt(authUtil.getJwt(registerUser.user_id))
        .post(`${EZD_API_BASE_URL}/v1/user/${registerUser.user_id}/pw`, {
          body: {
            password: 'wrong password!',
            nextPassword: nextRegisterUserPw,
          },
        });
      expect(changePwRes.status).toBe(400);
      let rawRespBody = await changePwRes.json();
      assert(prim.isObject(rawRespBody));
      expect(rawRespBody.code).toBe('EZD_0.1');
    });
  });

  describe('change password', () => {

    test(`non-privileged user can't change other user's password`, async () => {
      assert(user1 !== undefined);
      assert(user2 !== undefined);
      let user1Jwt = authUtil.getJwt(user1.user_id);
      let changePwRes = await hc.withJwt(user1Jwt)
        .post(`${EZD_API_BASE_URL}/v1/user/${user2.user_id}/pw`, {
          body: {
            password: user1Pw,
            nextPassword: 'fake user2 pw',
          },
        });
      expect(changePwRes.status).toBe(403);
    });

    test(`tests privileged user can change other user's password`, async () => {
      assert(user1 !== undefined);
      user1NextPw = userUtil.getTestPw();
      assert(user1NextPw !== user1Pw);
      let changPwRes = await hc.withJwt(apiJwt)
        .post(`${EZD_API_BASE_URL}/v1/user/${user1.user_id}/pw`, {
          body: {
            nextPassword: user1NextPw,
          },
        });
      expect(changPwRes.status).toBe(200);
      user1Pw = user1NextPw;
      user1NextPw = undefined;
    });

    test('tests login with changed user password', async () => {
      assert(user1 !== undefined);
      let url = `${EZD_API_BASE_URL}/v1/user/login`;
      let body = {
        userName: user1.user_name,
        password: user1Pw,
      } as const;
      let loginResp = await hc.post(url, { body });
      expect(loginResp.status).toBe(200);
      let rawRespBody = await loginResp.json();
      assert(prim.isObject(rawRespBody) && prim.isObject(rawRespBody.user));
      let rawUser = rawRespBody.user;
      expect(rawUser.user_name).toBe(body.userName);
    });
  });
});
