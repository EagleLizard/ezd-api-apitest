
import { Type, Static } from 'typebox';
import { tbUtil } from '../util/tb-util';
import { ezdPermissionSchema } from './ezd-permission';

const EzdRoleTSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String(),
  permissions: Type.Optional(Type.Array(ezdPermissionSchema.schema)),
});
export type EzdRole = Static<typeof EzdRoleTSchema>;

export const EzdRoleSchema = {
  schema: EzdRoleTSchema,
  decode: decodeEzdRole,
} as const;

function decodeEzdRole(val: unknown): EzdRole {
  return tbUtil.decodeWithSchema(EzdRoleTSchema, val);
}

const EzdRoleDtoTSchema = Type.Object({
  role_id: Type.Number(),
  role_name: Type.String(),
  created_at: Type.String(),
  modified_at: Type.String(),
});
export type EzdRoleDto = Static<typeof EzdRoleDtoTSchema>;
export const EzdRoleDto = {
  schema: EzdRoleDtoTSchema,
  decode: decodeEzdRoleDto,
} as const;

function decodeEzdRoleDto(rawVal: unknown): EzdRoleDto {
  return tbUtil.decodeWithSchema(EzdRoleDtoTSchema, rawVal);
}
