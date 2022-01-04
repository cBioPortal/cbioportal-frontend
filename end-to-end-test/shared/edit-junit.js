var fs = require('fs'),
    xml2js = require('xml2js');
var _ = require('lodash');

function transformJUNITFiles(dir) {
    // fs.readdir(dir, function(err, files) {
    //     if (err) {
    //         console.log(err);
    //         return;
    //     }
    //     files
    //         .filter(s => /results.*.xml$/.test(s))
    //         .forEach(f => {
    //             tranformFile(`${dir}${f}`);
    //         });
    // });

    const files = fs.readdirSync(dir).filter(s => /results-.*\.xml$/i.test(s));

    console.log(`transforming ${files.length} in results in directory: `, dir);

    files.forEach(f => {
        tranformFile(`${dir}${f}`);
    });
}

function tranformFile(filePath) {
    console.log('transforming result xml', filePath);

    const data = fs.readFileSync(filePath);

    xml2js.parseString(data, function(err, result) {
        if (err) console.log(err);

        // for debugging, save original file
        //writeToXMLFile(`${filePath}.BK`, data);

        getTestCase(result, testcases => {
            const groups = _.groupBy(testcases, t => t.$.name);

            _.forEach(groups, group => {
                // if there is more than one test with matching name (retries)
                // remove all but the last test
                // which will either be an error or passing
                if (group.length > 1) {
                    const removed = _.pull(testcases, ...group.slice(0, -1));
                    try {
                        console.log(
                            'Eliminating duplicate test report',
                            removed[0].$.name
                        );
                    } catch (ex) {
                        // silent
                    }
                }
            });
        });

        result.testsuites.testsuite.forEach(testsuite => {
            if (testsuite.testcase) {
                testsuite.$.errors = testsuite.testcase
                    .filter(t => 'error' in t)
                    .length.toString();

                testsuite.$.tests = testsuite.testcase.length;
            }
        });

        console.log(result.testsuites.testsuite[2]); // need to transform tessuides here

        writeToXMLFile(filePath, result);
    });

    // fs.readFile(filePath, 'utf-8', function(err, data) {
    //     if (err) console.log(err);
    //
    //     console.log('reading xml', filePath);
    //
    //     xml2js.parseString(data, function(err, result) {
    //         if (err) console.log(err);
    //
    //         // for debugging, save original file
    //         //writeToXMLFile(`${filePath}.BK`, data);
    //
    //         getTestCase(result, testcase => {
    //             const groups = _.groupBy(testcase, t => t.$.name);
    //
    //             _.forEach(groups, group => {
    //                 // if there is more than one test with matching name (retries)
    //                 // remove all but the last test
    //                 // which will either be an error or passing
    //                 if (group.length > 1) {
    //                     const removed = _.pull(testcase, ...group.slice(0, -1));
    //                     try {
    //                         console.log(
    //                             'Eliminating duplicate test report',
    //                             removed[0].$.name
    //                         );
    //                     } catch (ex) {
    //                         // silent
    //                     }
    //                 }
    //             });
    //         });
    //
    //         writeToXMLFile(filePath, result);
    //     });
    // });
}

function writeToXMLFile(path, json) {
    // create a new builder object and then convert
    // our json back to xml.
    var builder = new xml2js.Builder();
    var xml = builder.buildObject(json);

    console.log('writing xml', path);

    fs.writeFileSync(path, xml);
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
