var packageJSON = require('./package.json');

delete packageJSON.dependencies;

delete packageJSON.devDependencies;

delete packageJSON.scripts;

var fs = require('fs');
fs.writeFile("dist/package.json", JSON.stringify(packageJSON,  null, '\t'), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("Dist package json created");
});