"use strict";

import fs from 'fs';
import test from 'ava';
import * as crypto from '../src/crypto';


const PRIVATE_KEY = fs.readFileSync('./test/certificate-CZ1212121218/private.pem');
const TEST_PKP = 'QEIvS/3ETSJuAK7agvrVlQUN1Oi4DoPrNBmC+sQueNknhsr48RGElLpzTnxH/KUdfde91xFOcRbgyiXapK4beRTRaZ/CQ1qug4Y7JbnhB60WUH61E2NlTzxTfmidcNIlQohrVDC5awyrZQj2T1cG+3gGPHQ/oveM4ozt5gLaHFDwl421eLQctxeQfXK4dDrZDANX6AVB8Q92X89o9YouISCjIrYk7ZnLhDe+cXxlB0GGJq5i1P2uALOgQyZBU5mBWLolL2n06C73Sja7HjCt9E8s6bV9y1cJZcjXo1tWOEUqfU8ir/wYstO11v/JmiRADGwGoCuCszktUmf4K3PaDg==';
const TEST_BKP = 'b8f8392b-f73c8643-0ba0c171-142caa01-4c7a4078';


test('generatePKP', t => {

	const result = crypto.generatePKP(PRIVATE_KEY, {
		dic_popl: 'CZ1212121218',
		id_provoz: '273',
		id_pokl: '/5546/RO24',
		porad_cis: '0/6460/ZQ42',
		dat_trzby: '2016-08-05T00:30:12+02:00',
		celk_trzba: '34113.00',
	});

	t.is(result, TEST_PKP);

});

test('generateBKP', t => {
	t.is(crypto.generateBKP(TEST_PKP), TEST_BKP);
});
