var fs = require('fs'),
    xml2js = require('xml2js');
var _ = require('lodash');

function transformJUNITFiles(dir) {
    fs.readdir(dir, function(err, files) {
        if (err) {
            console.log(err);
            return;
        }
        files
            .filter(s => /results.*.xml$/.test(s))
            .forEach(f => {
                tranformFile(`${dir}/${f}`);
            });
    });
}

function tranformFile(filePath) {
    fs.readFile(filePath, 'utf-8', function(err, data) {
        if (err) console.log(err);

        xml2js.parseString(data, function(err, result) {
            if (err) console.log(err);

            // for debugging, save original file
            //writeToXMLFile(`${filePath}.BK`, data);

            getTestCase(result, testcase => {
                //console.log(testcase.length);

                const groups = _.groupBy(testcase, t => t.$.name);

                _.forEach(groups, group => {
                    _.pull(testcase, ...group.slice(0, -1));
                });
            });

            writeToXMLFile(filePath, result);
        });
    });
}

function writeToXMLFile(path, json) {
    // create a new builder object and then convert
    // our json back to xml.
    var builder = new xml2js.Builder();
    var xml = builder.buildObject(json);

    fs.writeFile(path, xml, function(err, data) {
        if (err) console.log(err);
        console.log('successfully written our update xml to file');
    });
}

function getTestCase(n, callback) {
    if (_.isObject(n)) {
        if (n.testcase) {
            callback(n.testcase);
        }
        _.forEach(n, nn => {
            getTestCase(nn, callback);
        });
    }
}

module.exports = {
    transformJUNITFiles,
};
