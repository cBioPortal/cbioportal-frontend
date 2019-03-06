import {initQueryIndicator} from "test/OncoKbMockUtils";
import {lazyMobXTableSort} from "shared/components/lazyMobXTable/LazyMobXTable";
import {IndicatorQueryResp} from "shared/api/generated/OncoKbAPI";
import {IOncoKbProps} from "./OncoKB";
import OncoKB from './OncoKB';
import React from 'react';
import { assert } from 'chai';
import {shallow, mount, ReactWrapper} from 'enzyme';
import sinon from 'sinon';

describe('OncoKB', () => {
    const props = {
        indicator: undefined,
        status: "pending"
    } as IOncoKbProps;

    let component: ReactWrapper<any, any>;

    before(() => {
        component = mount(<OncoKB {...props}/>);
    });

    it('displays a load spinner when there is no indicator data', () => {
        const spinner = component.find("Circle");

        assert.isTrue(spinner.exists(),
            "Spinner component should exist");

        assert.equal(spinner.prop("size"), 18,
            "Spinner size should be equal to 18");

        assert.equal(spinner.prop("color"), "#aaa",
            "Spinner color should be #aaa");
    });

    it('properly calculates OncoKB sort values', () => {

        let queryA = initQueryIndicator({
            oncogenic: 'Oncogenic'
        });

        let queryB = initQueryIndicator({
            oncogenic: 'Oncogenic'
        });

        let array:IndicatorQueryResp[] = [queryA, queryB];

        let sortedArray:IndicatorQueryResp[];

        assert.deepEqual(
            OncoKB.sortValue(queryA), OncoKB.sortValue(queryB),
            'Equal Oncogenicity');

        queryA.oncogenic = 'Oncogenic';
        queryB.oncogenic = 'Inconclusive';
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isAbove(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'Oncogenicity test 2');

        queryA.oncogenic = 'Oncogenic';
        queryB.oncogenic = 'Unknown';
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isAbove(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'Oncogenicity test 3');

        queryA.oncogenic = 'Oncogenic';
        queryB.oncogenic = 'Likely Neutral';
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isAbove(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'Oncogenicity test 4');

        queryA.oncogenic = 'Inconclusive';
        queryB.oncogenic = 'Unknown';
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isAbove(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'Oncogenicity test 5');

        queryA.oncogenic = 'Likely Neutral';
        queryB.oncogenic = 'Inconclusive';
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isAbove(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'Oncogenicity test 6');

        queryA = initQueryIndicator({
            oncogenic: 'Unknown',
            vus: true
        });
        queryB = initQueryIndicator({
            oncogenic: 'Unknown',
            vus: false
        });
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isAbove(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'A is VUS, which should have higher score.');

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: 'LEVEL_1'
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: 'LEVEL_2A'
        });
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isAbove(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'A(LEVEL_1) should be higher than B(LEVEL_2A)');

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestResistanceLevel: 'LEVEL_R1'
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestResistanceLevel: 'LEVEL_R2'
        });
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isAbove(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'A(LEVEL_R1) should be higher than B(LEVEL_R2)');

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: 'LEVEL_2A',
            highestResistanceLevel: ''
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: '',
            highestResistanceLevel: 'LEVEL_R1'
        });
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isAbove(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'A(LEVEL_2A) should be higher than B(LEVEL_R1)');

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic'
        });
        queryB = initQueryIndicator({
            oncogenic: 'Unknown',
            highestSensitiveLevel: 'LEVEL_2A'
        });
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isAbove(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'The score for Oncogenic variant(A) should always higher than other categories(B) even B has treatments.');

        // GeneExist tests
        queryA = initQueryIndicator({
            geneExist: true
        });
        queryB = initQueryIndicator({
            geneExist: false
        });
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isAbove(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'A should be higher than B.');

        // GeneExist tests
        queryA = initQueryIndicator({
            geneExist: false,
            oncogenic: 'Oncogenic'
        });
        queryB = initQueryIndicator({
            geneExist: true
        });
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isAbove(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'A should be higher than B even A gene does not exist. Because A has higher oncogenicity.');

        // VariantExist does not have any impact any more
        queryA = initQueryIndicator({
            variantExist: false
        });
        queryB = initQueryIndicator({
            variantExist: true,
            highestSensitiveLevel: 'LEVEL_2A'
        });
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isBelow(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'A should be lower than B.');

        queryA = initQueryIndicator({
            variantExist: true
        });
        queryB = initQueryIndicator({
            variantExist: false,
            highestSensitiveLevel: 'LEVEL_2A'
        });
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isBelow(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'A should be lower than B[LEVEL_2A] even B variant does not exist.');

        // Is Hotspot does not have any impact any more
        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            hotspot: false
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            hotspot: true,
            highestSensitiveLevel: 'LEVEL_2A'
        });
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isBelow(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'A should be lower than B.');

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            hotspot: true
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            hotspot: false,
            highestSensitiveLevel: 'LEVEL_2A'
        });
        array = [queryB, queryA];
        sortedArray = lazyMobXTableSort<IndicatorQueryResp>(array, OncoKB.sortValue, true);
        assert.isBelow(
            sortedArray.indexOf(queryA), sortedArray.indexOf(queryB),
            'A should be lower than B[LEVEL_2A] even A is hotspot.');
    });

    after(() => {

    });
});
