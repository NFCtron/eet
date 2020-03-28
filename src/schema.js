"use strict";

import { v4 as uuidV4 } from 'uuid';
import {
	convertAmountToString,
	convertBooleanToString,
	convertDateToString,
	isDefined,
	validateAmount,
	validateCzVatId,
	validateIdPokl,
	validateIdProvoz,
	validatePoradCis,
	validateUuidV4,
} from './utils';
import { RequestParsingError } from './errors';


export const SCHEMA = {
	uuidZpravy: {
		type: 'header',
		name: 'uuid_zpravy',
		required: true,
		getDefault: () => uuidV4(),
		validate: validateUuidV4,
	},
	datOdesl: {
		type: 'header',
		name: 'dat_odesl',
		required: true,
		getDefault: () => new Date(),
		validate: value => value instanceof Date,
		format: convertDateToString,
	},
	prvniZaslani: {
		type: 'header',
		name: 'prvni_zaslani',
		required: true,
		getDefault: () => true,
		validate: value => typeof value === 'boolean',
		format: convertBooleanToString,
	},
	overeni: {
		type: 'header',
		name: 'overeni',
		required: true,
		getDefault: () => false,
		validate: value => typeof value === 'boolean',
		format: convertBooleanToString,
	},
	dicPopl: {
		type: 'data',
		name: 'dic_popl',
		required: true,
		validate: validateCzVatId,
	},
	dicPoverujiciho: {
		type: 'data',
		name: 'dic_poverujiciho',
		required: false,
		validate: validateCzVatId,
	},
	idProvoz: {
		type: 'data',
		name: 'id_provoz',
		required: true,
		validate: validateIdProvoz,
		format: value => value.toString(),
	},
	idPokl: {
		type: 'data',
		name: 'id_pokl',
		required: true,
		validate: validateIdPokl,
	},
	poradCis: {
		type: 'data',
		name: 'porad_cis',
		required: true,
		validate: validatePoradCis,
	},
	datTrzby: {
		type: 'data',
		name: 'dat_trzby',
		required: true,
		validate: value => value instanceof Date,
		format: convertDateToString,
	},
	celkTrzba: {
		type: 'data',
		name: 'celk_trzba',
		required: true,
		validate: validateAmount,
		format: convertAmountToString,
	},
	zaklNepodlDph: {
		type: 'data',
		name: 'zakl_nepodl_dph',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	zaklDan1: {
		type: 'data',
		name: 'zakl_dan1',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	dan1: {
		type: 'data',
		name: 'dan1',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	zaklDan2: {
		type: 'data',
		name: 'zakl_dan2',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	dan2: {
		type: 'data',
		name: 'dan2',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	zaklDan3: {
		type: 'data',
		name: 'zakl_dan3',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	dan3: {
		type: 'data',
		name: 'dan3',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	cestSluz: {
		type: 'data',
		name: 'cest_sluz',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	pouzitZboz1: {
		type: 'data',
		name: 'pouzit_zboz1',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	pouzitZboz2: {
		type: 'data',
		name: 'pouzit_zboz2',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	pouzitZboz3: {
		type: 'data',
		name: 'pouzit_zboz3',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	urcenoCerpZuct: {
		type: 'data',
		name: 'urceno_cerp_zuct',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	cerpZuct: {
		type: 'data',
		name: 'cerp_zuct',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	rezim: {
		type: 'data',
		name: 'rezim',
		required: true,
		getDefault: () => 0,
		validate: value => value === 0 || value === 1,
		format: value => value.toString(),
	},
};


export const parseRequest = request => {

	if (!isDefined(request) || typeof request !== 'object') {
		throw new RequestParsingError('Invalid request data given. Data must be a non-null object.', request);
	}

	// TODO: consider using Map of Maps instead of plain object
	const result = {
		header: {},
		data: {},
	};

	for (const [key, {
		type,
		name,
		required,
		getDefault,
		validate,
		format = value => value
	}] of Object.entries(SCHEMA)) {

		const value = !isDefined(request[key]) && isDefined(getDefault)
			? getDefault()
			: request[key];

		if (required && !isDefined(value)) {
			throw new RequestParsingError(`${key} must be set.`, request);
		}

		if (!isDefined(value)) {
			continue;
		}

		if (!validate(value)) {
			throw new RequestParsingError(`Validation failed for ${key}. '${value}' given.`, value);
		}

		result[type][name] = format(value);

	}

	return result;

};
