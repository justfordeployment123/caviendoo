export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}
