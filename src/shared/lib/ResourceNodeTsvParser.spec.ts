import { assert } from 'chai';
import { parseTsvToRows } from './ResourceNodeTsvParser';

const SAMPLE_TSV = `PATIENT_ID\tSAMPLE_ID\tRESOURCE_ID\tURL\tDISPLAY_NAME\tTYPE\tGROUP_PATH\tMETADATA
P001\tS001\tpathology\thttps://viewer/1\tH&E\tH_AND_E\tBlock A\t{"site": "colon"}
P001\tS001\tpathology\thttps://viewer/2\tIHC CD3\tIHC\tBlock A\t{"site": "colon", "marker": "CD3"}
P001\tS002\tpathology\thttps://viewer/3\tH&E\tH_AND_E\tBlock B\t{"site": "liver"}
P001\tS001\tct_scans\thttps://ohif/1\tAxial T2\tCT\t\t{"modality": "CT"}`;

describe('ResourceNodeTsvParser', () => {
    describe('parseTsvToRows', () => {
        it('parses TSV string into typed rows', () => {
            const rows = parseTsvToRows(SAMPLE_TSV);
            assert.equal(rows.length, 4);
            assert.equal(rows[0].patientId, 'P001');
            assert.equal(rows[0].sampleId, 'S001');
            assert.equal(rows[0].resourceId, 'pathology');
            assert.equal(rows[0].url, 'https://viewer/1');
            assert.equal(rows[0].displayName, 'H&E');
            assert.equal(rows[0].type, 'H_AND_E');
            assert.equal(rows[0].groupPath, 'Block A');
            assert.deepEqual(rows[0].metadata, { site: 'colon' });
        });

        it('handles empty GROUP_PATH', () => {
            const rows = parseTsvToRows(SAMPLE_TSV);
            const ctRow = rows[3];
            assert.equal(ctRow.groupPath, '');
        });

        it('handles empty METADATA', () => {
            const tsv = `PATIENT_ID\tSAMPLE_ID\tRESOURCE_ID\tURL\tDISPLAY_NAME\tTYPE\tGROUP_PATH\tMETADATA
P001\tS001\treports\thttps://r/1\tReport\tPDF\t\t`;
            const rows = parseTsvToRows(tsv);
            assert.deepEqual(rows[0].metadata, undefined);
        });

        it('parses all rows correctly', () => {
            const rows = parseTsvToRows(SAMPLE_TSV);
            assert.equal(rows[1].displayName, 'IHC CD3');
            assert.deepEqual(rows[1].metadata, {
                site: 'colon',
                marker: 'CD3',
            });
            assert.equal(rows[2].sampleId, 'S002');
            assert.equal(rows[2].groupPath, 'Block B');
        });
    });
});
