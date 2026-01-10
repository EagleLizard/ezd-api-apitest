
import 'dotenv/config';
import { prim } from './util/validate-primitives';

const EZD_API_BASE_URL = getEnvVarOrErr('EZD_API_BASE_URL');

export const apitestConfig = {
  EZD_API_BASE_URL: EZD_API_BASE_URL,
  EZD_API_USER_PASSWORD: getEnvVarOrErr('EZD_API_USER_PASSWORD'),
  EZD_JWT_SECRET: getEnvVarOrErr('EZD_JWT_SECRET'),
} as const;

function getEnvVarOrErr(envKey: string): string {
  let rawEnvVar: string | undefined;
  rawEnvVar = process.env[envKey];
  if(!prim.isString(rawEnvVar)) {
    throw new Error(`Invalid ${envKey}`);
  }
  return rawEnvVar;
}
