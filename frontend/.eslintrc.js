module.exports = {
  env: {
    browser: true,
    es2021:  true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion:  'latest',
    sourceType:   'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react', 'react-hooks'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',  // not needed with Vite/React 17+
    'no-unused-vars':           ['warn', { argsIgnorePattern: '^_' }],
    'eqeqeq':                   ['error', 'always'],
    'no-var':                   'error',
    'prefer-const':             'warn',
  },
};
