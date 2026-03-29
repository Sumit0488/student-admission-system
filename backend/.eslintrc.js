module.exports = {
  env: {
    node:  true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-unused-vars':    ['warn', { argsIgnorePattern: '^_' }],
    'no-console':        'off',   // console.log is fine in Node.js servers
    'eqeqeq':            ['error', 'always'],
    'no-var':            'error',
    'prefer-const':      'warn',
    'no-trailing-spaces': 'warn',
  },
};
