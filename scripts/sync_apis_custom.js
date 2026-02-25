const https = require('https');
const fs = require('fs');
const path = require('path');

const GENOME_NEXUS_URL = process.env.GENOME_NEXUS_URL || 'https://www.genomenexus.org';

function fetchAndClean(url, outputPath) {
    console.log(`Fetching from ${url}...`);
    https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            console.log(`Following redirect to ${res.headers.location}...`);
            fetchAndClean(res.headers.location, outputPath);
            return;
        }
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const jsonObj = JSON.parse(data);
                delete jsonObj.basePath;
                delete jsonObj.termsOfService;
                delete jsonObj.host;

                const dir = path.dirname(outputPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                fs.writeFileSync(outputPath, JSON.stringify(jsonObj, null, 2));
                console.log(`Successfully updated ${outputPath}`);
            } catch (e) {
                console.error(`Error processing ${url}: ${e.message}`);
            }
        });
    }).on('error', (err) => {
        console.error(`Error fetching ${url}: ${err.message}`);
    });
}

// Update OncoKB
fetchAndClean('https://www.oncokb.org/api/v1/v2/api-docs?group=Public%20APIs', 'packages/oncokb-ts-api-client/src/generated/OncoKbAPI-docs.json');

// Update GenomeNexus
fetchAndClean(`${GENOME_NEXUS_URL}/v2/api-docs`, 'packages/genome-nexus-ts-api-client/src/generated/GenomeNexusAPI-docs.json');
fetchAndClean(`${GENOME_NEXUS_URL}/v2/api-docs?group=internal`, 'packages/genome-nexus-ts-api-client/src/generated/GenomeNexusAPIInternal-docs.json');
