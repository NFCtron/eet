"use strict";


/**
 * Converts Date so string
 *
 * Datum je potreba prevest na  ISO 8601, je ale potreba dat pryc ms,
 * protoze jinak vraci EET servery chybu "spatny format".
 *
 */
function formatDate(date) {

	return date.toISOString().split('.')[0] + 'Z';

}

function formatBool(value, defaultValue) {

	if (value === undefined) {
		value = defaultValue;
	}

	return value ? 'true' : 'false';

}

function formatNumber(num) {

	return !isNaN(+num) ? (+num).toFixed(2) : num;

}

function isDefinedAndNotNull(value) {

	return value !== undefined && value !== null;

}

exports.formatDate = formatDate;
exports.formatBool = formatBool;
exports.formatNumber = formatNumber;
exports.isDefinedAndNotNull = isDefinedAndNotNull;
