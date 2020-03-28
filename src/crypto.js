"use strict";

import crypto from 'crypto';


/**
 * Generates PKP (podpisovy kod poplatnika)
 * PKP is a SHA256 hash encoded as base64 string (so it IS case sensitive)
 * @param privateKey {string | Buffer | KeyObject}
 * @see http://www.etrzby.cz/assets/cs/prilohy/EET_popis_rozhrani_v3.1.1.pdf EET docs (section 4.1)
 */
export const generatePKP = (privateKey, { dic_popl, id_provoz, id_pokl, porad_cis, dat_trzby, celk_trzba }) => {

	const options = [dic_popl, id_provoz, id_pokl, porad_cis, dat_trzby, celk_trzba];
	const strToHash = options.join('|');

	return signSha256Base64(privateKey, strToHash);

};

/**
 * Generates BKP (bezpecnostni kod poplatnika)
 * BKP is a SHA1 hash encoded as hex string (case insensitive),
 *   that is visually formatted as 5 blocks of 8 chars joined with '-'
 * note: this function always returns lowercase BKP
 * @see http://www.etrzby.cz/assets/cs/prilohy/EET_popis_rozhrani_v3.1.1.pdf EET docs (section 4.2)
 */
export const generateBKP = pkp => {

	const buffer = Buffer.from(pkp, 'base64');
	const sha1str = hashSha1Hex(buffer);

	return [sha1str.slice(0, 8), sha1str.slice(8, 16), sha1str.slice(16, 24), sha1str.slice(24, 32), sha1str.slice(32, 40)]
		.join('-')
		.toLowerCase();

};


export const signSha256Base64 = (privateKey, data) => {

	const sign = crypto.createSign('rsa-sha256');
	sign.update(data);

	return sign.sign(privateKey, 'base64');

};


export const hashSha1Hex = data => {

	const hash = crypto.createHash('sha1');
	hash.update(data);

	return hash.digest('hex');

};


export const hashSha256Base64 = data => {

	const hash = crypto.createHash('sha256');
	hash.update(data);

	return hash.digest('base64');

};

/**
 * Removes header and footer from PKCS#1 formatted string
 * @param fileContent {string}
 * @returns {string}
 */
export const removePkcsHeader = fileContent =>
	fileContent
		.toString()
		.replace(/\r?\n/g, '')
		.replace(/-----BEGIN (CERTIFICATE|RSA PRIVATE KEY)-----/, '')
		.replace(/-----END (CERTIFICATE|RSA PRIVATE KEY)-----/, '')
;
