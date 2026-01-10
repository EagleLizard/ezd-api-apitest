
import { authUtil } from './auth/auth-util';

/*
  Need to use top-level await, which vitest supports
_*/
await setupEzdCtx();

async function setupEzdCtx() {
  let loginResp = await authUtil.loginApiUser();
  globalThis.ezdCtx = {
    apiUser: loginResp.user,
  };
}
