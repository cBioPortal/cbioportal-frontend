import {assert} from 'chai';
import {calculateLayout, getLayoutMatrix, LayoutMatrixItem} from './StudyViewUtils';
import {ChartDimension, ChartMeta, ChartType} from './StudyViewPageStore';
import {Layout} from 'react-grid-layout';
import {ClinicalAttribute} from "../../shared/api/generated/CBioPortalAPI";
import {observable} from "mobx";

describe.only('StudyViewUtils', () => {
    let visibleAttrs: ChartMeta[] = [];
    const clinicalAttr: ClinicalAttribute = {
        'clinicalAttributeId': 'test',
        'count': 0,
        'datatype': 'STRING',
        'description': '',
        'displayName': '',
        'patientAttribute': true,
        'priority': '1',
        'studyId': ''
    };
    before(() => {
        for (let i = 0; i < 8; i++) {
            visibleAttrs.push({
                clinicalAttribute: clinicalAttr,
                uniqueKey: 'test' + i,
                defaultChartType: ChartType.PIE_CHART,
                dimension: {w: 1, h: 1}
            });
        }
    });

    describe("getLayoutMatrix", () => {
        it("The result is not expected, the chart should only occupy the first element of the matrix", () => {
            let result: LayoutMatrixItem[] = getLayoutMatrix([], 'test', {w: 1, h: 1});
            assert.equal(result.length, 1);
            assert.isTrue(result[0].notFull);
            assert.equal(result[0].matrix[0], 'test');
            assert.equal(result[0].matrix[1], '');
        });

        it("The result is not expected, the chart should occupy the first and second elements of the matrix", () => {
            let result: LayoutMatrixItem[] = getLayoutMatrix([], 'test', {w: 2, h: 1});
            assert.equal(result.length, 1);
            assert.isTrue(result[0].notFull);
            assert.equal(result[0].matrix[0], 'test');
            assert.equal(result[0].matrix[1], 'test');
            assert.equal(result[0].matrix[2], '');
        });

        it("The result is not expected, the chart should only occupy the first and third element of the matrix", () => {
            let result: LayoutMatrixItem[] = getLayoutMatrix([], 'test', {w: 1, h: 2});
            assert.equal(result.length, 1);
            assert.isTrue(result[0].notFull);
            assert.equal(result[0].matrix[0], 'test');
            assert.equal(result[0].matrix[1], '');
            assert.equal(result[0].matrix[2], 'test');
        });

        it("The result is not expected, the chart should only occupy the third and forth element of the matrix", () => {
            let result: LayoutMatrixItem[] = getLayoutMatrix([{
                notFull: true,
                matrix: ['key', 'key', '', '']
            }], 'test', {w: 2, h: 1});
            assert.equal(result.length, 1);
            assert.isFalse(result[0].notFull);
            assert.equal(result[0].matrix[0], 'key');
            assert.equal(result[0].matrix[1], 'key');
            assert.equal(result[0].matrix[2], 'test');
            assert.equal(result[0].matrix[3], 'test');
        });

        it("The result is not expected, the additional matrix should be added when the new chart cannot fit in the original matrix", () => {
            let result: LayoutMatrixItem[] = getLayoutMatrix([{
                notFull: true,
                matrix: ['key', 'key', 'key', '']
            }], 'test', {w: 2, h: 1});
            assert.equal(result.length, 2);
            assert.isTrue(result[0].notFull);
            assert.equal(result[0].matrix[3], '');
            assert.equal(result[1].matrix[0], 'test');
            assert.equal(result[1].matrix[1], 'test');
            assert.equal(result[1].matrix[2], '');
        });
    });

    describe("calculateLayout", () => {
        it("Empty array should be returned when no attributes given", () => {
            let layout: Layout[] = calculateLayout([], 6, observable.map<ChartDimension>());
            assert.isArray(layout);
            assert.equal(layout.length, 0);
        });

        it("The layout is not expected", () => {
            let layout: Layout[] = calculateLayout(visibleAttrs, 6, observable.map<ChartDimension>());
            assert.equal(layout.length, 8);
            assert.equal(layout[0].i, 'test0');
            assert.equal(layout[0].x, 0);
            assert.equal(layout[0].y, 0);
            assert.equal(layout[1].i, 'test1');
            assert.equal(layout[1].x, 1);
            assert.equal(layout[1].y, 0);
            assert.equal(layout[2].i, 'test2');
            assert.equal(layout[2].x, 0);
            assert.equal(layout[2].y, 1);
            assert.equal(layout[3].i, 'test3');
            assert.equal(layout[3].x, 1);
            assert.equal(layout[3].y, 1);
            assert.equal(layout[4].i, 'test4');
            assert.equal(layout[4].x, 2);
            assert.equal(layout[4].y, 0);
            assert.equal(layout[5].i, 'test5');
            assert.equal(layout[5].x, 3);
            assert.equal(layout[5].y, 0);
            assert.equal(layout[6].i, 'test6');
            assert.equal(layout[6].x, 2);
            assert.equal(layout[6].y, 1);
            assert.equal(layout[7].i, 'test7');
            assert.equal(layout[7].x, 3);
            assert.equal(layout[7].y, 1);
        });

        it("The layout is not expected", () => {
            let layout: Layout[] = calculateLayout(visibleAttrs, 2, observable.map<ChartDimension>());
            assert.equal(layout.length, 8);
            assert.equal(layout[0].i, 'test0');
            assert.equal(layout[0].x, 0);
            assert.equal(layout[0].y, 0);
            assert.equal(layout[1].i, 'test1');
            assert.equal(layout[1].x, 1);
            assert.equal(layout[1].y, 0);
            assert.equal(layout[2].i, 'test2');
            assert.equal(layout[2].x, 0);
            assert.equal(layout[2].y, 1);
            assert.equal(layout[3].i, 'test3');
            assert.equal(layout[3].x, 1);
            assert.equal(layout[3].y, 1);
            assert.equal(layout[4].i, 'test4');
            assert.equal(layout[4].x, 0);
            assert.equal(layout[4].y, 2);
            assert.equal(layout[5].i, 'test5');
            assert.equal(layout[5].x, 1);
            assert.equal(layout[5].y, 2);
            assert.equal(layout[6].i, 'test6');
            assert.equal(layout[6].x, 0);
            assert.equal(layout[6].y, 3);
            assert.equal(layout[7].i, 'test7');
            assert.equal(layout[7].x, 1);
            assert.equal(layout[7].y, 3);
        });
    });
});
