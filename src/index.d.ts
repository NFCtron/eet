// Type definitions for index.js
/// <reference types="node" />

import { Agent } from 'https';
import { KeyLike } from 'crypto';

export const PLAYGROUND_URL: string;
export const PRODUCTION_URL: string;

export { FetchError } from 'node-fetch';

// server returned error
export class ResponseServerError extends Error {

	message: string;
	code: string;
	datOdmit: string;

	constructor(message: string, code: string, datOdmit: string);

}

// response could not be parsed
export class ResponseParsingError extends Error {

	message: string;
	code: string;
	line: string;

	constructor(message: string, code: string, line: string);

}

// request could not be parsed
export class RequestParsingError extends Error {

	message: string;

	constructor(message: string);

}

// server sent wrong or unexpected response
export class WrongServerResponse extends Error {

	message: string;

	constructor(message: string);

}

interface EETRequest {

	/**
	 * UUID of the request, default is UUID v4 generated via uuidjs/uuid library
	 * @see https://github.com/uuidjs/uuid
	 */
	uuidZpravy?: string;

	/**
	 * Time of request sending, default is new Date()
	 */
	datOdesl?: Date;

	/**
	 * If true, flags request as first submit trial, default is true
	 */
	prvniZaslani?: boolean;

	/**
	 * If true, submits request verification mode, default is false
	 */
	overeni?: boolean;
	dicPopl: string;
	dicPoverujiciho?: string;
	idProvoz: number;
	idPokl: string;
	poradCis: string;
	datTrzby: Date;
	celkTrzba: number;
	zaklNepodlDph?: number;
	zaklDan1?: number;
	dan1?: number;
	zaklDan2?: number;
	dan2?: number;
	zaklDan3?: number;
	dan3?: number;
	cestSluz?: number;
	pouzitZboz1?: number;
	pouzitZboz2?: number;
	pouzitZboz3?: number;
	urcenoCerpZuct?: number;
	cerpZuct?: number;

	/**
	 * EET mode
	 * defaults to 0 = bezny rezim
	 * 1 = zjednoduseny rezim
	 */
	rezim?: 0 | 1;

}

interface EETOptions {

	/**
	 * Private key for request digital signature
	 */
	privateKey: KeyLike;

	/**
	 * Certificate containing public key associated to the private key
	 * PEM base64 string
	 */
	certificate: string;

	/**
	 * Response timeout in milliseconds, default is 10000 (10 s)
	 */
	timeout?: number;

	/**
	 * If true, requests are sent to the EET Playground, default is false
	 * (i.e. requests are sent to the EET production server)
	 */
	playground?: boolean;

	/**
	 * Optional request to response time measurement, default is false
	 * If set to true, measured time will be returned in EETResponse.responseTime
	 * @see {EETResponse.responseTime}
	 */
	measureResponseTime?: boolean;

	/**
	 * Custom HTTP User-Agent header
	 * Default is 'nfctron/eet (+github.com/NFCtron/eet)'
	 */
	userAgent?: string;

	/**
	 * Custom Node HTTPS Agent to send request through
	 * @see https://nodejs.org/api/https.html#https_class_https_agent
	 */
	agent?: Agent;

}

interface EETParsedRequest {

	uuidZpravy: string;
	datOdesl: string;
	prvniZaslani: string;
	overeni: string;

	dicPopl: string;
	dicPoverujiciho?: string;
	idProvoz: string;
	idPokl: string;
	poradCis: string;
	datTrzby: string;
	celkTrzba: number;
	zaklNepodlDph?: string;
	zaklDan1?: string;
	dan1?: string;
	zaklDan2?: string;
	dan2?: string;
	zaklDan3?: string;
	dan3?: string;
	cestSluz?: string;
	pouzitZboz1?: string;
	pouzitZboz2?: string;
	pouzitZboz3?: string;
	urcenoCerpZuct?: string;
	cerpZuct?: string;
	rezim: '0' | '1';

}

interface EETError {

	message: string;
	code: string;

}

interface EETResponse {

	uuidZpravy: string;
	bkp: string;
	datPrij: Date;

	/**
	 * Equals to EETOptions.playground
	 * @see {EETOptions.playground}
	 */
	test: boolean;

	fik: string;

	warnings: EETError[];

	/**
	 * Measured time (in milliseconds) to get the response
	 * Only present if EETOptions.measureResponseTime was set to true
	 * @see {EETOptions.measureResponseTime}
	 */
	responseTime?: number;

}

interface EETReturn {

	request: EETParsedRequest;
	response: EETResponse;

	/**
	 * Raw text response exactly as received from the EET server
	 */
	rawResponse: string;

}

/**
 * Sends request to EET server
 * @param request {EETRequest}
 * @param options {EETOptions}
 * @return {Promise<EETReturn>}
 * @throws {RequestParsingError}
 * @throws {ResponseParsingError}
 * @throws {ResponseServerError}
 * @throws {WrongServerResponse}
 */
export function sendEETRequest(request: EETRequest, options: EETOptions): Promise<EETReturn>;
