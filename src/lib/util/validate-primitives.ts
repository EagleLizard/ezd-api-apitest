
import assert from 'node:assert';

export const prim = {
  isObject: isObject,
  isString: isString,
  isPromise: isPromise,

  isArrayBuffer: isArrayBuffer,

  arr: isArray,
  obj: isObject,
  str: isString,
  bool: isBoolean,
} as const;

function isArray(val: unknown): val is unknown[] {
  return Array.isArray(val);
}

function isArrayBuffer(val: unknown): val is ArrayBuffer {
  return val instanceof ArrayBuffer;
}

function isObject(val: unknown): val is Record<string | number, unknown> {
// function isObject(val: unknown): val is { [x: string|number]: unknown } {
  return (
    (val !== null)
    && ((typeof val) === 'object')
  );
}

function isString(val: unknown): val is string {
  return (typeof val) === 'string';
}

function isBoolean(val: unknown): val is boolean {
  return (typeof val) === 'boolean';
}

export function isPromise<T>(val: unknown): val is Promise<T> {
  if(!isObject(val)) {
    return false;
  }
  if(val instanceof Promise) {
    return true;
  }
  return (typeof val?.then) === 'function';
}
