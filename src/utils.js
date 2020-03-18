"use strict";


/**
 * Checks whether the given value is not undefined and not null
 * @param value
 * @return {boolean}
 */
export const isDefined = value => value !== undefined && value !== null;

/**
 * Converts Date to string
 * Date needs to be converted to ISO 8601 but without ms string,
 * otherwise EET returns error 'spatny format'.
 * @param date {Date}
 * @return {string}
 */
export const convertDateToString = date => date.toISOString().split('.')[0] + 'Z';

/**
 * Converts boolean to string
 * @param value {boolean}
 * @return {string} 'true' for true, 'false' for false
 */
export const convertBooleanToString = value => value ? 'true' : 'false';

/**
 * Converts amount in hundredths of CZK (haléře, same as cents) to string
 * @param hundredths {number}
 * @return {string}
 */
export const convertAmountToString = hundredths => {

	const crowns = hundredths / 100;
	return crowns.toFixed(2);

};


export const UUID_V4_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
export const CZ_VAT_ID_PATTERN = /^CZ[0-9]{8,10}$/;
export const STRING_20_PATTERN = /^[0-9a-zA-Z.,:;/#\-_ ]{1,20}$/;
export const STRING_25_PATTERN = /^[0-9a-zA-Z.,:;/#\-_ ]{1,25}$/;

export const validateUuidV4 = value => typeof value == 'string' && UUID_V4_PATTERN.test(value);

export const validateCzVatId = value => typeof value == 'string' && CZ_VAT_ID_PATTERN.test(value);

export const validateIdProvoz = value => Number.isInteger(value) && value > 0 && value < 1000000;

export const validateIdPokl = value => typeof value == 'string' && STRING_20_PATTERN.test(value);

export const validatePoradCis = value => typeof value == 'string' && STRING_25_PATTERN.test(value);

export const validateAmount = value => Number.isInteger(value) && value > -10000000000 && value < 10000000000;
