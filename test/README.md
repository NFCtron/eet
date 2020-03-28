# Tests

We are using [AVA: Futuristic JavaScript test runner](https://github.com/avajs/ava).  

You can run tests with:

```bash
yarn test
```

It is a shortcut for `cross-env NODE_ENV=test nyc ava test/tests.js --verbose`
which runs all the tests defined in tests.js file and prints the tests coverage using [nyc](https://github.com/istanbuljs/nyc).

For re-running tests whenever you change the sources, you can use:

```bash
yarn test-hot
```

It is a shortcut for `cross-env NODE_ENV=test ava test/tests.js --verbose --watch`.
