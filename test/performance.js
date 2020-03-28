"use strict";

const { randomBytes } = require('crypto');
const fs = require('fs');

const { sendEETRequest } = require('../src/index');


const PRIVATE_KEY = fs.readFileSync('./test/certificate-CZ1212121218/private.pem');
const CERTIFICATE = fs.readFileSync('./test/certificate-CZ1212121218/certificate.pem');


const options = {
	privateKey: PRIVATE_KEY,
	certificate: CERTIFICATE,
	playground: true,
	timeout: 20000,
	measureResponseTime: true,
	offline: true,
};

const items = {

	// uuidZpravy: uuid.v4(), // by default
	// datOdesl: new Date(), // by default
	prvniZaslani: true,
	overeni: false,

	dicPopl: 'CZ1212121218',
	idProvoz: 273,
	idPokl: '/554/RO24',

	poradCis: '0/6460/ZQ42',
	datTrzby: new Date(),

	// celkTrzba: 100000, // 1000 CZK
	// urcenoCerpZuct: 100000, // 1000 CZK

	celkTrzba: 12100, // 121 CZK
	zaklDan1: 10000, // 100 CZK
	dan1: 2100, // 21 CZK
	cerpZuct: 12100, // 121 CZK

	rezim: 0,

};

const TEST_CASES = 20;
const start = process.hrtime();
const timing = [];
const test = [];

for (let i = 0; i < TEST_CASES; i++) {

	const time = process.hrtime();
	const id = randomBytes(5).toString('hex');

	const request = items;
	request[poradCis] = `${id}-${i.toString()}`;

	test.push(
		sendEETRequest(request, options)
			.then(({ response }) => {

				const diff = process.hrtime(time);

				const elapsedMilliseconds = (diff[0] * 1000) + (diff[1] / 1000 / 1000);

				const processTime = Math.round(elapsedMilliseconds * 100) / 100 - response.responseTime;

				timing.push(processTime);

				//console.log('Processed in', elapsedMilliseconds, response);

			})
			.catch(err => {

				console.log(err);

			}),
	);

}

Promise.all(test)
	.then(() => {

		const diff = process.hrtime(start);
		const elapsedMilliseconds = (diff[0] * 1000) + (diff[1] / 1000 / 1000);

		const totalProcessTime = timing.reduce((sum, value) => (sum + value), 0);
		const averageProcessTime = totalProcessTime / timing.length;

		console.log('total tests:', timing.length);
		timing.forEach((t, i) => console.log(`  ${i + 1}. - ${t.toFixed(2)} ms`));
		console.log('total process time', totalProcessTime.toFixed(2) + ' ms');
		console.log('average process time', averageProcessTime.toFixed(2) + ' ms');
		console.log('time to complete:', elapsedMilliseconds.toFixed(2));

	});
