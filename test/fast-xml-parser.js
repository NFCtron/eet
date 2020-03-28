"use strict";

import test from 'ava';
import parser from 'fast-xml-parser';


test('validate valid XML', async t => {

	const xml = '<Data><Error>Text</Error></Data>';

	const validationResult = parser.validate(xml);

	t.is(validationResult, true);

});

test('validate InvalidXml', async t => {

	const xml = '<Data><Error>Text</Error><Data>';

	const validationResult = parser.validate(xml);

	const expectedValidationResult = {
		err: {
			code: 'InvalidXml',
			msg: `Invalid '[    "Data",    "Data"]' found.`,
			line: 1,
		},
	};

	t.deepEqual(validationResult, expectedValidationResult);

});

test('parse invalid', async t => {

	const xml = `<Data><Error>Text</Error>`;

	// even invalid XML (missing trailing </Data>) gets parsed (the valid part)
	// so it is always needed to call parser.validate or parse with validate true
	const result = parser.parse(xml);

	const expectedResult = {
		Data: {
			Error: 'Text',
		},
	};

	t.deepEqual(result, expectedResult);

});

test('parse (with validation true) invalid', async t => {

	const xml = `<Data><Error>Text</Error>`;

	t.throws(
		() => {
			return parser.parse(xml, {}, true);
		},
		{
			instanceOf: Error,
			message: 'Invalid \'[    "Data"]\' found.',
		},
	);

});
