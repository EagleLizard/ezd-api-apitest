
/* typebox utils */

import { Static, TSchema } from 'typebox';
import { DecodeError, ParseError, Value } from 'typebox/value';
import { EzdError } from '../error/ezd-error';

export const tbUtil = {
  decodeWithSchema: decodeWithSchema,
} as const;

function decodeWithSchema<S extends TSchema>(tschema: S, rawVal: unknown): Static<S> {
  let decoded: Static<S>;
  try {
    decoded = Value.Parse(tschema, rawVal);
  } catch(e) {
    if(!(e instanceof DecodeError || e instanceof ParseError)) {
      throw e;
    }
    let errs = Value.Errors(tschema, rawVal);
    [ ...errs ].forEach((err, idx) => {
      console.log(err);
    });
    let errMsg = `${e.cause.errors[0].message}, path: ${e.cause.errors[0].schemaPath}`;
    throw new EzdError(errMsg, 'EAT_0.1', {
      cause: e,
    });
  }
  return decoded;
}
