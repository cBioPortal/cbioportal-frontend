const fs = require('fs/promises');
const watch = require('fs').watch;
const path = require('path');

watch('specs', async function(event, filename) {
    // console.log('event is: ' + event);
    // if (filename) {
    //     console.log('filename provided: ' + filename);
    // } else {
    //     console.log('filename not provided');
    // }

    if (event === 'change') {
        const files = (await fs.readdir('./specs')).map(fileName => {
            return path.join('./specs', fileName);
        });

        const jsons = files.map(path => {
            return fs.readFile(path).then(data => {
                const json = JSON.parse(data);
                return { file: path, suites: json };
            });
        });

        Promise.all(jsons).then(d => {
            fs.writeFile('output.json', JSON.stringify(d));
        });
    }
});
