"use strict";

import { Agent } from 'https';
import fs from 'fs';
import test from 'ava';
import * as eet from '../src/index';


const PRIVATE_KEY = fs.readFileSync('./test/certificate-CZ1212121218/private.pem');
const FAKE_PRIVATE_KEY = fs.readFileSync('./test/certificate-CZ1212121218/fake-private.pem');
const CERTIFICATE = fs.readFileSync('./test/certificate-CZ1212121218/certificate.pem');


test('sendEETRequest correct', async t => {

	const data = {
		prvniZaslani: true,
		overeni: false,
		dicPopl: 'CZ1212121218',
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date(),
		celkTrzba: 3411300,
		idProvoz: 273,
	};

	const options = {
		playground: true,
		privateKey: PRIVATE_KEY,
		certificate: CERTIFICATE,
		measureResponseTime: true,
	};

	const { response: { fik, warnings, responseTime }, rawResponse } = await eet.sendEETRequest(data, options);

	t.not(fik, undefined);
	t.is(fik.length, 39);
	t.deepEqual(warnings, []);
	t.assert(responseTime > 0);
	t.assert(rawResponse.length > 500);

	t.log('FIK:', fik);
	t.log('responseTime:', Math.round(responseTime), 'ms');

});

test('sendEETRequest correct all fields playground', async t => {

	const data = {
		prvniZaslani: true,
		overeni: false,
		dicPopl: 'CZ1212121218',
		dicPoverujiciho: 'CZ1212121218',
		idProvoz: 273,
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date(),
		celkTrzba: 3411300,
		zaklNepodlDph: 11041,
		dan1: 2000,
		zaklDan1: 10000,
		dan2: 1500,
		zaklDan2: 20000,
		dan3: 1000,
		zaklDan3: 30000,
		cestSluz: 9999,
		pouzitZboz1: 13579,
		pouzitZboz2: 21828,
		pouzitZboz3: 31415,
		urcenoCerpZuct: 42,
		cerpZuct: -1700,
		rezim: 1,
	};

	const options = {
		playground: true,
		privateKey: PRIVATE_KEY,
		certificate: CERTIFICATE,
		timeout: 8000,
		userAgent: 'DummyUserAgent/1.0',
		agent: new Agent(),
	};

	const { response: { fik, warnings } } = await eet.sendEETRequest(data, options);

	t.not(fik, undefined);
	t.is(fik.length, 39);
	t.deepEqual(warnings, []);

	t.log('FIK:', fik);

});

test('sendEETRequest wrong certificate', async t => {

	const data = {
		prvniZaslani: true,
		overeni: false,
		dicPopl: 'CZ1212121218',
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date('2016-08-05T00:30:12+02:00'),
		celkTrzba: 3411300,
		idProvoz: 273,
	};

	const options = {
		playground: true,
		privateKey: FAKE_PRIVATE_KEY,
		certificate: CERTIFICATE,
		offline: false,
	};

	const error = await t.throwsAsync(eet.sendEETRequest(data, options), { instanceOf: eet.ResponseServerError });

	t.is(error.code, '4');
	t.not(error.bkp, undefined);
	t.not(error.pkp, undefined);

	t.log('Error:', error.message);

});

test('sendEETRequest warning', async t => {

	const data = {
		prvniZaslani: true,
		overeni: false,
		dicPopl: 'CZ1212121218',
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date('2000-01-01T00:30:12+02:00'),
		celkTrzba: 3411300,
		idProvoz: 273,
	};

	const options = {
		playground: true,
		privateKey: PRIVATE_KEY,
		certificate: CERTIFICATE,
	};

	const { response: { fik, warnings } } = await eet.sendEETRequest(data, options);

	const expected = [{
		code: '5',
		message: 'Datum a cas prijeti trzby je vyrazne v minulosti',
	}];

	t.not(fik, undefined);
	t.deepEqual(warnings, expected);

	t.log('Warning:', warnings[0].message);

});

test('sendEETRequest overeni', async t => {

	const data = {
		prvniZaslani: true,
		overeni: true,
		dicPopl: 'CZ1212121218',
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date(),
		celkTrzba: 3411300,
		idProvoz: 273,
	};

	const options = {
		playground: true,
		privateKey: PRIVATE_KEY, // cannot sign message in production mode
		certificate: CERTIFICATE,
		measureResponseTime: true,
	};

	const error = await t.throwsAsync(eet.sendEETRequest(data, options), { instanceOf: eet.ResponseServerError });

	t.is(error.code, '0');
	t.is(error.message, 'Datovou zpravu evidovane trzby v overovacim modu se podarilo zpracovat');

	t.log('Error:', error.message);

});


test('sendEETRequest production', async t => {

	const data = {
		prvniZaslani: true,
		overeni: true,
		dicPopl: 'CZ1212121218',
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date(),
		celkTrzba: 3411300,
		idProvoz: 273,
	};

	const options = {
		playground: false,
		privateKey: PRIVATE_KEY, // cannot sign message in production mode
		certificate: CERTIFICATE,
		measureResponseTime: true,
	};

	const error = await t.throwsAsync(eet.sendEETRequest(data, options), { instanceOf: eet.ResponseServerError });

	t.is(error.code, '4');

	t.log('Error:', error.message);

});
