
import { Type, Static } from 'typebox';
import { tbUtil } from '../util/tb-util';

const EzdUserTSchema = Type.Object({
  user_id: Type.String(),
  email: Type.String(),
  user_name: Type.String(),
});
export type EzdUser = Static<typeof EzdUserTSchema>;
export const EzdUser = {
  decode: decodeEzdUser,
} as const;

function decodeEzdUser(rawVal: unknown): EzdUser {
  return tbUtil.decodeWithSchema(EzdUserTSchema, rawVal);
}

