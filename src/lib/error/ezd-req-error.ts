
import { EzdError } from './ezd-error';
import { EzdErrorCode, ezdErrorCodes } from './ezd-error-codes';

export class EzdReqError extends EzdError {
  resp?: Response;
  constructor(message?: string, code?: EzdErrorCode, resp?: Response, options?: ErrorOptions) {
    super(message, code ?? ezdErrorCodes.REQUEST_ERROR, options);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, EzdReqError.prototype);
    this.message = `${this.code}: Not Found`;
    if(message !== undefined) {
      this.message = `${this.message} - ${message}`;
    }
    this.resp = resp;
  }
}
