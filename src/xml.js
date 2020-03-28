"use strict";

import parser from 'fast-xml-parser';
import { convertStringToBool, convertStringToDate, isDefined, validateFik } from './utils';
import { hashSha256Base64, removePkcsHeader, signSha256Base64 } from './crypto';
import { ResponseParsingError, ResponseServerError, WrongServerResponse } from './errors';
import fetch from 'node-fetch';


/**
 * Serializes single empty XML with attributes in XML canonical form
 * Input must be sanitized against XSS
 * Canonicalization requirements:
 *   - tag must be properly closed
 *   - attributes must be sorted alphabetically
 * @see https://www.w3.org/TR/xml-exc-c14n/
 * @param tagName {string}
 * @param attributes {object}
 * @returns {string} XML tag in canonical form
 */
export const serializeXMLElement = (tagName, attributes) =>
	// found to be the fastest way to sort attributes
	// see benchmark: https://github.com/NFCtron/eet/commit/b628cb5a42d063f531ea1fe19f62ed3f54d7a4a0
	`<${tagName} ${
		Object.keys(attributes)
			.sort()
			.map(key => `${key}="${attributes[key]}"`)
			.join(' ')}></${tagName}>`
;

/**
 * Generates data for XML element KontrolniKody
 * @param pkp {string} PKP
 * @param bkp {string} BKP
 * @returns {string} KontrolniKody tag in canonical form
 */
export const serializeKontrolniKody = ({ pkp, bkp }) =>
	'<KontrolniKody>' +
	`<pkp cipher="RSA2048" digest="SHA256" encoding="base64">${pkp}</pkp>` +
	`<bkp digest="SHA1" encoding="base16">${bkp}</bkp>` +
	'</KontrolniKody>';
;

/**
 * Generates content for SOAP body from header and data objects
 * @param header {object}
 * @param data {object}
 * @param pkp {string}
 * @param bkp {string}
 * @returns {string} soap:Body tag in canonical form
 */
export const serializeSoapBody = ({ header, data, pkp, bkp }) =>
	'<soap:Body xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" id="Body">' +
	'<Trzba xmlns="http://fs.mfcr.cz/eet/schema/v3">' +
	serializeXMLElement('Hlavicka', header) +
	serializeXMLElement('Data', data) +
	serializeKontrolniKody({ pkp, bkp }) +
	'</Trzba>' +
	'</soap:Body>'
;

/**
 * Generates body signature for XML element SignedInfo
 * @param digest {string} a SHA256 hash of body encoded as base64 string
 * @returns {string} SignedInfo tag in canonical form
 */
export const serializeSignedInfo = digest =>
	'<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">' +
	'<CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod>' +
	'<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></SignatureMethod>' +
	'<Reference URI="#Body">' +
	'<Transforms>' +
	'<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>' +
	'<Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></Transform>' +
	'</Transforms>' +
	'<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></DigestMethod>' +
	`<DigestValue>${digest}</DigestValue>` +
	'</Reference>' +
	'</SignedInfo>'
;

/**
 * Generates full SOAP envelope with WSSecurity signature
 * @returns {string} soap:Envelope tag in canonical form
 */
export const serializeSoapEnvelope = ({ header, data, pkp, bkp, privateKey, certificate }) => {

	const body = serializeSoapBody({ header, data, bkp, pkp });
	const signedInfo = serializeSignedInfo(hashSha256Base64(body));
	const signature = signSha256Base64(privateKey, signedInfo);
	const publicKey = removePkcsHeader(certificate);

	return (
		`<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
			<soap:Header>
				<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" soap:mustUnderstand="1">
					<wsse:BinarySecurityToken wsu:Id="cert" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">${publicKey}</wsse:BinarySecurityToken>
					<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
						${signedInfo}
						<SignatureValue>${signature}</SignatureValue>
						<KeyInfo>
							<wsse:SecurityTokenReference>
								<wsse:Reference URI="#cert" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" />
							</wsse:SecurityTokenReference>
						</KeyInfo>
					</Signature>
				</wsse:Security>
			</soap:Header>
			${body}
		</soap:Envelope>`
	);

};

/**
 * Parses XML response into DOM
 * @param xml {string}
 * @returns {object}
 * @throws {ResponseParsingError}
 * @throws {ResponseServerError}
 */
export const parseResponseXML = (xml) => {

	const parsingError = parser.validate(xml);

	if (parsingError === true) {

		const options = {
			attributeNamePrefix: "_",
			ignoreAttributes: false,
			ignoreNameSpace: true,
			parseNodeValue: false,
			parseAttributeValue: false,
		};

		return parser.parse(xml, options);

	} else {

		const { msg, code, line } = parsingError.err;

		throw new ResponseParsingError(msg, code, line);

	}

};

/**
 * Transforms XML DOM into data object
 * @param parsed {object}
 * @returns {object}
 * @throws {WrongServerResponse}
 */
export const extractResponse = parsed => {

	if (!isDefined(parsed)) {
		throw new WrongServerResponse('XML response empty');
	}

	const odpoved = parsed['Envelope']?.['Body']?.['Odpoved'];

	if (!isDefined(odpoved)) {
		throw new WrongServerResponse('Response does not contain Envelope>Body>Odpoved');
	}

	const uuidZpravy = odpoved['Hlavicka']?.['_uuid_zpravy'];
	const bkp = odpoved['Hlavicka']?.['_bkp'];

	// test might be omitted if equal to false
	let test = false;

	if (isDefined(odpoved['Potvrzeni']?.['_test'])) {

		test = convertStringToBool(odpoved['Potvrzeni']['_test']);

		if (!isDefined(test)) {
			throw new WrongServerResponse('Response contains an invalid value in Hlavicka>test');
		}

	}

	// zero or one or multiple warnings can be included
	const warnings = isDefined(odpoved['Varovani'])
		? (Array.isArray(odpoved['Varovani'])
				? odpoved['Varovani'].map(warning => (
					{
						message: warning['#text'],
						code: warning['_kod_varov'],
					}
				))
				: [{
					message: odpoved['Varovani']['#text'],
					code: odpoved['Varovani']['_kod_varov'],
				}]
		)
		: [];

	if (isDefined(odpoved['Chyba'])) {

		const error = { message: odpoved['Chyba']['#text'], code: odpoved['Chyba']['_kod'] };

		// it may not me present if the error is too critical
		let datOdmit = undefined;

		if (isDefined(odpoved['Hlavicka']?.['_dat_odmit'])) {

			datOdmit = convertStringToDate(odpoved['Hlavicka']['_dat_odmit']);

			if (!isDefined(datOdmit)) {
				throw new WrongServerResponse('Response contains an invalid value for Hlavicka>dat_odmit');
			}

		}

		// see EET docs 3.5.2
		return {
			// from the element Hlavicka
			uuidZpravy,
			datOdmit,
			bkp,
			// from the element Chyba
			error,
			// from the element Varovani
			warnings,
		};

	}

	let datPrij = undefined;

	if (isDefined(odpoved['Hlavicka']?.['_dat_prij'])) {

		datPrij = convertStringToDate(odpoved['Hlavicka']['_dat_prij']);

		if (!isDefined(datPrij)) {
			throw new WrongServerResponse('Response contains an invalid value for Hlavicka>dat_prij');
		}

	}

	const fik = odpoved['Potvrzeni']?.['_fik'];

	// see EET docs 3.4.2
	return {
		// from the element Hlavicka
		uuidZpravy,
		datPrij,
		bkp,
		// from the element Potvrzeni
		test,
		fik,
		// from the element Varovani
		warnings,
	};

};

/**
 * Validates incoming response against sent request
 * UUID, BKP, test must be same in both response and request
 * datPrij and FIK must be valid
 * @throws {ResponseServerError}
 * @throws {WrongServerResponse}
 */
export const validateResponse = ({ reqUuid, reqBkp, reqPlayground }, { uuidZpravy, bkp, datPrij, test, fik, error, datOdmit }) => {

	if (isDefined(error)) {
		throw new ResponseServerError(error.message, error.code, datOdmit);
	}

	if (reqUuid !== uuidZpravy) {
		throw new WrongServerResponse(`UUID in response: ${uuidZpravy} is not same as sent: ${reqUuid}`);
	}

	if (reqBkp !== bkp) {
		throw new WrongServerResponse(`BKP in response: ${bkp} is not same as sent: ${reqBkp}`);
	}

	if (!isDefined(datPrij)) {
		throw new WrongServerResponse(`dat_prij in response is invalid: ${datPrij}`);
	}

	if (reqPlayground !== test) {
		throw new WrongServerResponse(`test in response: ${test} is not same as sent: ${reqPlayground}`);
	}

	if (!validateFik(fik)) {
		throw new WrongServerResponse(`FIK in response is invalid: ${fik}`);
	}

};

/**
 * Fetches URL and return XML response
 * @param url {string}
 * @param options {object}
 * @returns {Promise<string>}
 */
export const fetchXml = async (url, options) => {

	const response = await fetch(url, options);

	// check content-type header for text/xml of application/xml
	const contentType = response.headers.get('content-type');

	/* istanbul ignore next */
	if (!(contentType.includes('text/xml') || contentType.includes('application/xml'))) {
		throw new WrongServerResponse('Unknown content-type: ' + contentType);
	}

	return await response.text();

};
