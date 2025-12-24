class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  // Static method to create a 400 Bad Request error
  static badRequest(message = 'Bad Request') {
    return new ErrorResponse(message, 400);
  }

  // Static method to create a 401 Unauthorized error
  static unauthorized(message = 'Not authorized to access this route') {
    return new ErrorResponse(message, 401);
  }

  // Static method to create a 403 Forbidden error
  static forbidden(message = 'Forbidden') {
    return new ErrorResponse(message, 403);
  }

  // Static method to create a 404 Not Found error
  static notFound(message = 'Resource not found') {
    return new ErrorResponse(message, 404);
  }

  // Static method to create a 500 Internal Server Error
  static serverError(message = 'Internal Server Error') {
    return new ErrorResponse(message, 500);
  }

  // Static method to create a 409 Conflict error
  static conflict(message = 'Conflict') {
    return new ErrorResponse(message, 409);
  }

  // Static method to create a 422 Unprocessable Entity error
  static validationError(message = 'Validation Error') {
    return new ErrorResponse(message, 422);
  }
}

module.exports = ErrorResponse;
