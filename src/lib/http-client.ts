
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
  private _token?: string;
  private _headers: HeaderRecord;
  private constructor(token?: string, headers?: HeaderRecord) {
    this._token = token;
    this._headers = headers ?? Object.assign({}, defaultHeaders);
  }
  static init(): HttpClient {
    return new HttpClient();
  }
  post(url: string, opts: HttpClientReqOpts = {}): Promise<Response> {
    let reqInit: RequestInit = {
      method: 'POST',
      headers: this.getHeadersOpt(opts),
      body: getBodyOpt(opts),
    };
    return fetch(url, reqInit);
  }
  get(url: string, opts: HttpClientReqOpts = {}): Promise<Response> {
    let reqInit: RequestInit = {
      headers: this.getHeadersOpt(opts),
      body: getBodyOpt(opts),
    };
    return fetch(url, reqInit);
  }
  delete(url: string, opts: HttpClientReqOpts = {}): Promise<Response> {
    opts.headers ??= {};
    /* explicitly set to undefined so the default gets unset if present _*/
    opts.headers['Content-Type'] ??= undefined;
    let reqInit: RequestInit = {
      method: 'DELETE',
      headers: this.getHeadersOpt(opts),
      body: getBodyOpt(opts),
    };
    return fetch(url, reqInit);
  }
  withJwt(token?: string | undefined): HttpClient {
    // create a copy of the current client with the desired token
    return new HttpClient(token, this._headers);
  }
  private getHeadersOpt(opts: HttpClientReqOpts): HttpClientReqOpts['headers'] {
    let headers = Object.assign({}, this._headers, opts.headers);
    /* delete undefined entries _*/
    for(let k in headers) {
      if(headers[k] === undefined) {
        delete headers[k];
      }
    }
    if(opts.authToken !== undefined || this._token !== undefined) {
      let token = opts.authToken ?? this._token;
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
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
