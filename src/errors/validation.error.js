/* @flow */

export class ValidationError extends Error {
  fieldName: string;
  constructor(errorMessage: string, fieldName: string) {
    super(errorMessage);
    this.fieldName = fieldName;
  }
}
