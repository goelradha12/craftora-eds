module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    // Named function declarations are hoisted, so calling them before their
    // textual definition (a common pattern throughout this codebase, e.g.
    // decorate() calling helpers defined further down the file) is safe;
    // still flag real use-before-define bugs for let/const/class bindings.
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    // `_uploaded`/`_colorInitialized` are an established internal-flag naming
    // convention in the customizer state objects, not a style violation.
    'no-underscore-dangle': ['error', { allow: ['_uploaded', '_colorInitialized'] }],
  },
};
