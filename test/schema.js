"use strict";

import test from 'ava';
import * as schema from '../src/schema';
import * as errors from '../src/errors';


test('parseRequest', t => {

	const result = schema.parseRequest({
		dicPopl: 'CZ1212121218',
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date('2016-08-05T00:30:12+02:00'),
		celkTrzba: -3411380,
		idProvoz: 273,
	});

	const expected = {
		dic_popl: 'CZ1212121218',
		id_pokl: '/5546/RO24',
		porad_cis: '0/6460/ZQ42',
		dat_trzby: '2016-08-04T22:30:12Z',
		celk_trzba: '-34113.80',
		id_provoz: '273',
		rezim: '0',
	};

	t.deepEqual(result.data, expected);

});

test('parseRequest null', t => {
	t.throws(() => schema.parseRequest(null), { instanceOf: errors.RequestParsingError });
});

test('parseRequest valid', t => {

	t.notThrows(() => schema.parseRequest({
		dicPopl: 'CZ1212121218',
		dicPoverujiciho: 'CZ1212121218',
		idPokl: '1',
		idProvoz: 1,
		poradCis: '2016-0001s',
		datTrzby: new Date(),
		celkTrzba: 1000,
	}));

});

test('parseRequest wrong type', t => {

	t.throws(() => schema.parseRequest({
		dicPopl: 'CZ1212121218',
		idPokl: '1',
		idProvoz: 1,
		poradCis: '2016-0001s',
		datTrzby: new Date(),
		celkTrzba: 'abc',
	}), { instanceOf: errors.RequestParsingError });

});

test('parseRequest missing required', t => {

	t.throws(() => schema.parseRequest({
		idPokl: '1',
		idProvoz: 1,
		poradCis: '2016-0001s',
		datTrzby: new Date(),
		celkTrzba: 1000,
	}), { instanceOf: errors.RequestParsingError });

});
