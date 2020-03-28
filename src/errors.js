"use strict";

// server returned error
export class ResponseServerError extends Error {

	constructor(message, code, datOdmit) {

		super(message);
		this.code = code;
		this.datOdmit = datOdmit;
		Error.captureStackTrace(this, this.constructor);

	}

}

// response could not be parsed
export class ResponseParsingError extends Error {

	constructor(message, code, line) {

		super(message);
		this.code = code;
		this.line = line;
		Error.captureStackTrace(this, this.constructor);

	}

}

// request could not be parsed
export class RequestParsingError extends Error {

	constructor(message) {

		super(message);
		Error.captureStackTrace(this, this.constructor);

	}

}

// server sent wrong or unexpected response
export class WrongServerResponse extends Error {

	constructor(message) {

		super(message);
		Error.captureStackTrace(this, this.constructor);

	}

}
