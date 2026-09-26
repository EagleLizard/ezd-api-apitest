
/* typebox utils */

import type { StaticDecode, StaticType, TSchema } from 'typebox';
import { DecodeError, Value } from 'typebox/value';
import { EzdError } from '../error/ezd-error';

export const tbUtil = {
  decodeWithSchema: decodeWithSchema,
} as const;

function decodeWithSchema<
  S extends TSchema,
  /* eslint-disable-next-line @typescript-eslint/no-empty-object-type */
  T extends StaticType<[], 'Decode', {}, {}, S> = StaticDecode<S>
>(
  tschema: S,
  rawVal: unknown
): StaticDecode<S> {
  let decoded: T;
  try {
    decoded = Value.Decode<S>(tschema, rawVal);
  } catch(e) {
    if(!(e instanceof DecodeError)) {
      throw e;
    }
    let errs = Value.Errors(tschema, rawVal);
    [ ...errs ].forEach((err) => {
      console.log(err);
    });
    let errMsg = `${e.cause.errors[0].message}, path: ${e.cause.errors[0].schemaPath}`;
    throw new EzdError(errMsg, 'EAT_0.1', {
      cause: e,
    });
  }
  return decoded;
}
