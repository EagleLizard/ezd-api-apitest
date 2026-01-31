
import { apitestConfig } from '../apitest-config';
import { authUtil } from '../auth/auth-util';
import { EzdError } from '../error/ezd-error';
import { HttpClient } from '../http-client';
import { EzdUser } from '../models/ezd-user';
import { datetimeUtil } from './datetime-util';

const { EZD_API_BASE_URL } = apitestConfig;

let testUserCount = 0;
let testPwCount = 0;

export const userUtil = {
  createUser,
  deleteUser,
  getTestUsername,
  getTestPw,
} as const;

/*
suffix should be unique per suite to prevent collisions during parallel setup
_*/
function getTestUsername(suffix: string): string {
  let testUsername = `apitest_${datetimeUtil.alphaNumericDateTime()}_${suffix}_${testUserCount++}`;
  return testUsername;
}
function getTestPw(): string {
  return `pw+${datetimeUtil.alphaNumericDateTime()}+${testPwCount++}`;
}

async function createUser(name: string, email: string): Promise<EzdUser> {
  let apiJwt = authUtil.getJwt(globalThis.ezdCtx.apiUser.user_id);
  let hc = HttpClient.init().withJwt(apiJwt);
  let createUserResp = await hc.post(`${EZD_API_BASE_URL}/v1/user`, {
    body: {
      userName: name,
      email: email,
    },
  });
  if(createUserResp.status !== 200) {
    throw new EzdError(`Error creating user, name: ${name}, email: ${email}`, 'EAT_1.2');
  }
  let user = EzdUser.decode(await createUserResp.json());
  return user;
}

/* cleanup _*/
async function deleteUser(testUser: EzdUser) {
  let apiJwt = authUtil.getJwt(globalThis.ezdCtx.apiUser.user_id);
  let hc = HttpClient.init().withJwt(apiJwt);
  let usp = new URLSearchParams({name: testUser.user_name});
  let getUserResp = await hc.get(`${EZD_API_BASE_URL}/v1/user?${usp.toString()}`);
  if(getUserResp.status !== 200 && getUserResp.status !== 400) {
    throw new EzdError(`${
      getUserResp.status
    } - Failed to get test user during cleanup, name: '${testUser.user_name}'`, 'EAT_1.3');
  }
  // let testUser = EzdUser.decode(await getUserResp.json());
  if(getUserResp.status === 200) {
    /* delete */
    let delResp = await hc.delete(`${EZD_API_BASE_URL}/v1/user/${testUser.user_id}`);
    if(delResp.status !== 200) {
      throw new EzdError(`${
        delResp.status
      } - Failed to delete test user during cleanup, name: '${
        testUser.user_name
      }', id: ${testUser.user_id}`);
    }
  }
}
