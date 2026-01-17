
import { Type, Static } from 'typebox';
import { tbUtil } from '../util/tb-util';

const EzdRoleTSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String(),
});
export type EzdRole = Static<typeof EzdRoleTSchema>;

export const EzdRoleSchema = {
  schema: EzdRoleTSchema,
  decode: decodeEzdRole,
} as const;

function decodeEzdRole(val: unknown): EzdRole {
  return tbUtil.decodeWithSchema(EzdRoleTSchema, val);
}
