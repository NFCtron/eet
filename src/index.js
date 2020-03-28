"use strict";

import { generateBKP, generatePKP } from './crypto';
import { parseRequest } from './schema';
import { extractResponse, fetchXml, parseResponseXML, serializeSoapEnvelope, validateResponse } from './xml';
import { isDefined } from './utils';


// re-export "public" API so it is accessible from direct module import
export { ResponseParsingError, ResponseServerError, RequestParsingError, WrongServerResponse } from './errors';
export { parseRequest, generateBKP, generatePKP };
export { FetchError } from 'node-fetch';

export const PLAYGROUND_URL = 'https://pg.eet.cz/eet/services/EETServiceSOAP/v3';
export const PRODUCTION_URL = 'https://prod.eet.cz/eet/services/EETServiceSOAP/v3';


/**
 * Sends request to EET server
 * @param request {object}
 * @param options {object}
 * @return {Promise.<object>}
 * @throws {RequestParsingError}
 * @throws {ResponseParsingError}
 * @throws {ResponseServerError}
 * @throws {WrongServerResponse}
 */
export const sendEETRequest = async (request, options) => {

	const parsedRequest = parseRequest(request);
	const { header, data } = parsedRequest;
	const pkp = generatePKP(options.privateKey, data);
	const bkp = generateBKP(pkp);

	const url = options.playground ? PLAYGROUND_URL : PRODUCTION_URL;
	const startTime = options.measureResponseTime ? process.hrtime.bigint() : undefined;

	// formatted according to https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
	const userAgent = isDefined(options.userAgent) ? options.userAgent : 'nfctron/eet (+github.com/NFCtron/eet)';

	try {

		const message = serializeSoapEnvelope({
			header,
			data,
			pkp,
			bkp,
			privateKey: options.privateKey,
			certificate: options.certificate,
		});

		const fetchOptions = {

			// these properties are part of the Fetch Standard
			method: 'POST',
			headers: {
				'Accept-Encoding': 'gzip,deflate',
				'Accept': 'application/xml, text/xml',
				'Connection': 'close',
				'User-Agent': userAgent,
				'Content-type': ['application/xml; charset=UTF-8'],
			},
			body: message,
			redirect: 'error', // `error` to reject redirects
			signal: options.signal, // optional abort signal

			// the following properties are node-fetch extensions
			follow: 0, // maximum redirect count. 0 to not follow redirect
			timeout: isDefined(options.timeout) ? options.timeout : 10000,
			size: 65536, // (= 64 KB) maximum response size in bytes, unofficial
			agent: options.agent, // HTTPS agent, see https://nodejs.org/api/https.html#https_class_https_agent

		};

		const xml = await fetchXml(url, fetchOptions);

		const parsed = parseResponseXML(xml);

		const response = extractResponse(parsed);

		validateResponse({
			reqUuid: header.uuid_zpravy,
			reqBkp: bkp,
			reqPlayground: options.playground,
		}, response);

		if (options.measureResponseTime) {
			// save response timeout in milliseconds
			const endTime = process.hrtime.bigint();
			response.responseTime = Number((endTime - startTime)) / 1000000;
		}

		return {
			request: parsedRequest,
			response: response,
			rawResponse: xml,
		};

	} catch (error) {

		// always return PKP and BKP in case of error in order to use offline mode
		error.pkp = pkp;
		error.bkp = bkp;
		throw error;

	}

};
