const { createClient } = require('@clickhouse/client');
const _ = require('lodash');

const client = createClient({
    host:
        process.env.CLICKHOUSE_HOST ??
        'https://mecgt250i0.us-east-1.aws.clickhouse.cloud:8443/cgds_public_v5',
    username: process.env.CLICKHOUSE_USER ?? 'app_user',
    password: process.env.CLICKHOUSE_PASSWORD ?? 'P@ssword1976',
    request_timeout: 600000,
});

async function mainInsert() {
    const studies = await getStudies();

    const entities = await getEntities();

    let profiles = await getProfiles();

    const then = Date.now();

    //profiles = profiles.slice(0,1);

    //console.log(profiles);

    for (const profile of profiles) {
        console.log(`inserting ${profile.stable_id}`);
        try {
            await insertProfile(profile.genetic_profile_id);
        } catch (ex) {
            console.log(`ERROR inserting ${profile.stable_id}`);
            console.log(ex);
        }
    }

    // for (const study of studies) {
    //     console.log(
    //         `inserting ${study.cancer_study_id} ${study.cancer_study_identifier}`
    //     );
    //     try {
    //         await insertStudy(study.cancer_study_id);
    //     } catch (ex) {
    //         console.log(
    //             `ERROR inserting ${study.cancer_study_id} ${study.cancer_study_identifier}`
    //         );
    //         console.log(ex);
    //     }
    // }

    // for (const entity of entities) {
    //     try {
    //         await insertProfile(2071, entity.genetic_entity_id);
    //     } catch (ex) {
    //         console.log(`ERROR inserting ${entity.genetic_entity_id}`);
    //         console.log(ex);
    //     }
    // }

    console.log(`Finished in ${Date.now() - then}`);

    //const result = insertStudy(392);

    //console.log(result);
}

async function mainPatient() {
    getPatientIds();
}

async function insertStudy(cancer_study_id) {
    const resultSet = await client.query({
        query: queryByStudies({ cancer_study_id }),
        format: 'JSONEachRow',
    });

    const dataset = await resultSet.json(); // or `row.text` to avoid parsing JSON

    return dataset;
}

async function insertProfile(genetic_profile_id) {
    const resultSet = await client.query({
        query: queryByProfiles({ genetic_profile_id }),
        format: 'JSONEachRow',
    });

    const dataset = await resultSet.json(); // or `row.text` to avoid parsing JSON

    return dataset;
}

async function getProfiles() {
    const resultSet = await client.query({
        query: `SELECT * FROM genetic_profile
                WHERE genetic_profile.genetic_alteration_type NOT IN ('GENERIC_ASSAY', 'MUTATION_EXTENDED', 'STRUCTURAL_VARIANT')
        `,
        format: 'JSONEachRow',
    });

    const dataset = await resultSet.json(); // or `row.text` to avoid parsing JSON

    return dataset;
}

async function getEntities() {
    const resultSet = await client.query({
        query:
            'SELECT * FROM genetic_alteration ga WHERE ga.genetic_profile_id=2071',
        format: 'JSONEachRow',
    });

    const dataset = await resultSet.json(); // or `row.text` to avoid parsing JSON

    return dataset;
}

async function getPatientIds() {
    const resultSet = await client.query({
        query: `SELECT p.stable_id, cs.cancer_study_identifier FROM patient p
                JOIN cancer_study cs ON cs.cancer_study_id = p.cancer_study_id

        `,
        format: 'JSONEachRow',
    });

    const dataset = await resultSet.json(); // or `row.text` to avoid parsing JSON

    const grouped = _.groupBy(
        dataset,
        p =>
            `${p.stable_id.replace(
                /-/g,
                ''
            )}|${p.cancer_study_identifier.toUpperCase()}`
    );

    console.log(_.values(grouped).length);

    console.log(_.values(grouped).filter(a => a.length > 1));

    //return dataset;
}

async function getStudies() {
    const resultSet = await client.query({
        query: 'select * from cancer_study',
        format: 'JSONEachRow',
    });

    const dataset = await resultSet.json(); // or `row.text` to avoid parsing JSON

    return dataset;
}

const queryByStudies = _.template(
    `
INSERT INTO TABLE genetic_alteration_derivedFIXED
SELECT
    sample_unique_id,
    cancer_study_identifier,
    hugo_gene_symbol,
    replaceOne(stable_id, concat(sd.cancer_study_identifier, '_'), '') as profile_type,
    alteration_value
FROM
    (SELECT
         sample_id,
         hugo_gene_symbol,
         stable_id,
         alteration_value
     FROM
         (SELECT
              g.hugo_gene_symbol AS hugo_gene_symbol,
              gp.stable_id as stable_id,
              arrayMap(x -> (x = '' ? NULL : x), splitByString(',', assumeNotNull(substring(ga.values, 1, length(ga.values) - 1)))) AS alteration_value,
              arrayMap(x -> (x = '' ? NULL : toInt32(x)), splitByString(',', assumeNotNull(substring(gps.ordered_sample_list, 1, length(gps.ordered_sample_list) - 1)))) AS sample_id
          FROM
              genetic_profile gp
                  JOIN genetic_profile_samples gps ON gp.genetic_profile_id = gps.genetic_profile_id
                  JOIN genetic_alteration ga ON gp.genetic_profile_id = ga.genetic_profile_id
                  JOIN gene g ON ga.genetic_entity_id = g.genetic_entity_id
          WHERE
                  cancer_study_id=<%= cancer_study_id %>
            AND
                  gp.genetic_alteration_type NOT IN ('GENERIC_ASSAY', 'MUTATION_EXTENDED', 'STRUCTURAL_VARIANT')
             )
         ARRAY JOIN alteration_value, sample_id
     WHERE alteration_value != 'NA') AS subquery
        JOIN sample_derived sd ON sd.internal_id = subquery.sample_id;
 `
);

const queryByProfiles = _.template(
    `
INSERT INTO TABLE genetic_alteration_derivedFIXED
SELECT
    sample_unique_id,
    cancer_study_identifier,
    hugo_gene_symbol,
    replaceOne(stable_id, concat(sd.cancer_study_identifier, '_'), '') as profile_type,
    alteration_value
FROM
    (SELECT
         sample_id,
         hugo_gene_symbol,
         stable_id,
         alteration_value
     FROM
         (SELECT
              g.hugo_gene_symbol AS hugo_gene_symbol,
              gp.stable_id as stable_id,
              arrayMap(x -> (x = '' ? NULL : x), splitByString(',', assumeNotNull(substring(ga.values, 1, length(ga.values) - 1)))) AS alteration_value,
              arrayMap(x -> (x = '' ? NULL : toInt32(x)), splitByString(',', assumeNotNull(substring(gps.ordered_sample_list, 1, length(gps.ordered_sample_list) - 1)))) AS sample_id
          FROM
              genetic_profile gp
                  JOIN genetic_profile_samples gps ON gp.genetic_profile_id = gps.genetic_profile_id
                  JOIN genetic_alteration ga ON gp.genetic_profile_id = ga.genetic_profile_id
                  JOIN gene g ON ga.genetic_entity_id = g.genetic_entity_id
          WHERE
                  ga.genetic_profile_id='<%= genetic_profile_id %>'
            AND
                  gp.genetic_alteration_type NOT IN ('GENERIC_ASSAY', 'MUTATION_EXTENDED', 'STRUCTURAL_VARIANT')
             )
         ARRAY JOIN alteration_value, sample_id
     WHERE alteration_value != 'NA') AS subquery
        JOIN sample_derived sd ON sd.internal_id = subquery.sample_id;
 `
);

mainInsert();
