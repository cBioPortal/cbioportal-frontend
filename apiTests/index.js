const fs = require('fs/promises');
const watch = require('fs').watch;
const path = require('path');

watch('./apiTests/specs', async function(event, filename) {
    if (event === 'change') {
        const files = (await fs.readdir('./apiTests/specs')).map(fileName => {
            return path.join('./apiTests/specs', fileName);
        });

        const jsons = files.map(path => {
            return fs.readFile(path).then(data => {
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
                fs.writeFile('./apiTests/merged-tests.json', JSON.stringify(d));
            })
            .then(r => console.log('merged-tests.json written'));
    }
});
