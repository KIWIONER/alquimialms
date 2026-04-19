const { createRequire } = require('module');
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
console.log('PDF-PARSE type:', typeof pdf);
console.log('PDF-PARSE keys:', Object.keys(pdf));
