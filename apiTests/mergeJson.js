const fsProm = require('fs/promises');
const path = require('path');

async function mergeApiTestJson() {
    const files = (await fsProm.readdir('./apiTests/specs')).map(fileName => {
        return path.join('./apiTests/specs', fileName);
    });

    const jsons = files.map(path => {
        return fsProm.readFile(path).then(data => {
            try {
                const json = JSON.parse(data);
                return { file: path, suites: json };
            } catch (ex) {
                console.log('invalid apiTest json spec');
                return [];
            }
        });
    });

    Promise.all(jsons)
        .then(d => {
            fsProm.writeFile('./apiTests/merged-tests.json', JSON.stringify(d));
        })
        .then(r => console.log('merged-tests.json written'));
}

exports.mergeApiTestJson = mergeApiTestJson;
