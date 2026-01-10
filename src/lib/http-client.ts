
import type { HeaderRecord } from 'undici-types/header';
import { EzdError } from './error/ezd-error';

export type HttpClientReqOpts = {
  /* bearer token _*/
  authToken?: string;
  headers?: HeaderRecord;
  body?: unknown;
  bodyInit?: RequestInit['body'];
} & {};

const defaultHeaders: HeaderRecord = {
  'Content-Type': 'application/json',
};

/*
Utility class that wraps fetch()
_*/
export class HttpClient {
  async post(url: string, opts: HttpClientReqOpts = {}) {
    let reqInit: RequestInit = {
      method: 'POST',
      headers: getHeadersOpt(opts),
      body: getBodyOpt(opts),
    };
    return fetch(url, reqInit);
  }
  async get(url: string, opts: HttpClientReqOpts = {}) {
    let reqInit: RequestInit = {
      headers: getHeadersOpt(opts),
      body: getBodyOpt(opts),
    };
    if(opts.body !== undefined) {
      reqInit.body = JSON.stringify(opts.body);
    }
    return fetch(url, reqInit);
  }
}

function getHeadersOpt(opts: HttpClientReqOpts): HttpClientReqOpts['headers'] {
  let headers = Object.assign({}, defaultHeaders, opts.headers);
  if(opts.authToken !== undefined) {
    headers['Authorization'] = `Bearer ${opts.authToken}`;
  }
  return headers;
}

function getBodyOpt(opts: HttpClientReqOpts): RequestInit['body'] {
  let body: RequestInit['body'];
  if(opts.body !== undefined && opts.bodyInit !== undefined) {
    throw new EzdError(`Cannot include both 'body' and 'bodyInit'`, 'EAT_0.2');
  } else if(opts.body !== undefined) {
    body = JSON.stringify(opts.body);
  } else if(opts.bodyInit !== undefined) {
    body = opts.bodyInit;
  }
  return body;
}
