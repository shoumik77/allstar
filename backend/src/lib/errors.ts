export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = 'error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message: string, code = 'bad_request') => new HttpError(400, message, code);
export const unauthorized = (message = 'Unauthorized', code = 'unauthorized') => new HttpError(401, message, code);
export const forbidden = (message = 'Forbidden', code = 'forbidden') => new HttpError(403, message, code);
export const notFound = (message = 'Not found', code = 'not_found') => new HttpError(404, message, code);
export const conflict = (message: string, code = 'conflict') => new HttpError(409, message, code);
