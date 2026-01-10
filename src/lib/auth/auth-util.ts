
import jwt from 'jsonwebtoken';

import { apitestConfig } from '../apitest-config';
import { EzdError } from '../error/ezd-error';
import { EzdReqError } from '../error/ezd-req-error';
import { EzdUser } from '../models/ezd-user';
import { prim } from '../util/validate-primitives';

type LoginApiUserResp = {
  user: EzdUser;
  // cookie: string;
} & {};

export const authUtil = {
  getJwt: getJwt,
  loginApiUser: loginApiUser,
} as const;

function getJwt(userId: string): string {
  let token = jwt.sign({
    iss: 'ezd-api',
    aud: 'api-user',
    exp: Math.ceil(Date.now() / 1000) + 7200,
    userId: userId,
  }, apitestConfig.EZD_JWT_SECRET);
  return token;
}

async function loginApiUser(): Promise<LoginApiUserResp> {
  let loginBody = {
    userName: 'ezd_api',
    password: apitestConfig.EZD_API_USER_PASSWORD,
  } as const;
  let url = `${apitestConfig.EZD_API_BASE_URL}/v1/user/login`;
  let res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loginBody),
  });
  if(res.status !== 200) {
    throw new EzdReqError(`${res.status} ${res.statusText}`, 'EAT_1.1', res);
  }
  let rawResp = await res.json();
  let user: EzdUser;
  if(!prim.isObject(rawResp)) {
    console.error(rawResp);
    throw new EzdError('Invalid user returned for api user');
  }
  let rawCookie: string | unknown;
  if(!prim.isString(rawCookie = res.headers.get('set-cookie'))) {
    throw new EzdError('Invalid set-cookie header for api-user');
  }
  // /* get the cookie _*/
  user = EzdUser.decode(rawResp.user);
  // console.log({user})
  // user = Object.assign({}, rawResp);
  return {
    user,
    // cookie: rawCookie,
  };
}
