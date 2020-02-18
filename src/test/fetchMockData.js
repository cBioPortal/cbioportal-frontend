#!/usr/bin/env node

'use strict';

/* eslint-disable no-console */
const http = require('http');
const fs = require('fs');
const mockDataURLs = require('./mockDataURLs.json');
// eslint-disable-next-line
const colors = require('colors');
const spawn = require('child_process').spawn;
const ArgumentParser = require('argparse').ArgumentParser;

const API_ROOT = 'cbioportal-rc.herokuapp.com/api';

const storeFile = (url, outputFile) => response => {
    let str = '';

    response.on('data', chunk => {
        str += chunk;
    });

    response.on('end', () => {
        fs.writeFile(outputFile, JSON.stringify(JSON.parse(str), null, 4), e => {
            if (e) {
                return 1;
            }
            console.log(`✓ Downloaded ${url} to ${outputFile}`.green);
            return 0;
        });
    });
};

const downloadFileFromURL = (url, file, postData) => {
    const urlSplit = url.split('/');
    const options = {
        hostname: urlSplit[0],
        path: `/${urlSplit.slice(1, urlSplit.length).join('/')}`,
    };

    if (postData) {
        options.json = true;
        options.method = 'POST';
        options.headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            Accept: 'application/json',
            'Content-Length': JSON.stringify(postData).length,
        };
    } else {
        options.method = 'GET';
    }
    const req = http.request(options, storeFile(url, file));
    if (postData) {
        req.write(JSON.stringify(postData));
    }
    req.end();

    req.on('error', e => {
        console.error(e);
    });
};

const main = testDiff => {
    const failed = [];
    let URLsProcessed = 0;
    let fail;

    mockDataURLs.forEach(x => {
        URLsProcessed += 1;

        if (x.implemented === 'true') {
            console.log(`Getting data from ${API_ROOT}/${x.url}`);
            fail = downloadFileFromURL(`${API_ROOT}/${x.url}`, x.file, x.data);
            if (testDiff) {
                const diff = spawn('git', ['diff', '--quiet', x.file]);
                diff.on('close', code => {
                    if (!code || fail) {
                        failed.push(x);
                    }
                });
            }
        } else {
            console.log(`Skipping ${API_ROOT}/${x.url}: NOT_IMPLEMENTED`);
        }

        if (URLsProcessed === mockDataURLs.length) {
            if (failed.length > 0) {
                console.log('✗ FAILED: Following files in API differ from stored mockData:'.red);
                failed.forEach(file => {
                    console.log(`✗ File from API is differs from stored mock ${file}`.red);
                });
                process.exit(1);
            }
        }
    });
};

if (require.main === module) {
    const parser = new ArgumentParser({
        addHelp: true,
        description: 'Download mock data & test if it is different from repo',
    });
    parser.addArgument(['-d', '--diff'], {
        help: 'Test if files are different using git diff',
        type: Boolean,
        action: 'storeTrue',
    });
    const args = parser.parseArgs();
    main(args.diff);
}
