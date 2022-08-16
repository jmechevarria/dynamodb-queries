exports.CustomError = class CustomError extends Error {
  constructor(message, code, info) {
    super(message);
    this.code = code;
    this.info = info;
  }
};
