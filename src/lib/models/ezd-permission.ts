
import { Type, Static } from 'typebox';
import { tbUtil } from '../util/tb-util';

const EzdPermissionTSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
});
export type EzdPermission = Static<typeof EzdPermissionTSchema>;

export const ezdPermissionSchema = {
  schema: EzdPermissionTSchema,
  decode: decodeEzdPermission,
} as const;

function decodeEzdPermission(val: unknown): EzdPermission {
  return tbUtil.decodeWithSchema(EzdPermissionTSchema, val);
}
