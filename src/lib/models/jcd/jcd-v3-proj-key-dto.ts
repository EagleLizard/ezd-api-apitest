
import { Type, Static } from 'typebox';
import { tbUtil } from '../../util/tb-util';

const JcdV3ProjKeyDtoTSchema = Type.Object({
  projectKey: Type.String(),
  active: Type.Boolean(),
});
export type JcdV3ProjKeyDto = Static<typeof JcdV3ProjKeyDtoTSchema>;
export const  JcdV3ProjKeyDto = {
  schema: JcdV3ProjKeyDtoTSchema,
  decode: (val: unknown): JcdV3ProjKeyDto => {
    return tbUtil.decodeWithSchema<
      typeof JcdV3ProjKeyDtoTSchema,
      JcdV3ProjKeyDto
    >(JcdV3ProjKeyDtoTSchema, val);
  }
} as const;
