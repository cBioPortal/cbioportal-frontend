// output to src/shared/api
var fs = require('fs');
var path = require('path');
var request = require('request');
var CodeGen = require('swagger-js-codegen').CodeGen;

var swagger = JSON.parse(fs.readFileSync('src/shared/api/CBioPortalAPI-docs.json'));
var tsSourceCode = CodeGen.getTypescriptCode({className: 'CBioPortalAPI', swagger});
fs.writeFileSync('src/shared/api/CBioPortalAPI.ts', tsSourceCode);
