// output to src/shared/api
var fs = require('fs');
var path = require('path');
var request = require('request');
var CodeGen = require('swagger-js-codegen').CodeGen;

var swagger = JSON.parse(fs.readFileSync('src/shared/api/CancerHotspotsAPI-docs.json'));
var tsSourceCode = CodeGen.getTypescriptCode({className: 'CancerHotspotsAPI', swagger});
fs.writeFileSync('src/shared/api/CancerHotspotsAPI.ts', tsSourceCode);
