import * as MutationUtils from 'shared/lib/MutationUtils';
import VAFChart from './VAFChart';
import React from 'react';

describe('VAFChart', () => {
    it('reuses one cached VAF report across repeated points for the same mutation', () => {
        const getVariantAlleleFrequencySpy = jest
            .spyOn(MutationUtils, 'getVariantAlleleFrequency')
            .mockReturnValue({
                totalReadCount: 30,
                vaf: 1 / 3,
                variantReadCount: 10,
            });

        const mutation = {
            gene: { hugoGeneSymbol: 'TP53' },
            proteinChange: 'R175H',
            tumorAltCount: 10,
            tumorRefCount: 20,
        } as any;

        const props = {
            mouseOverMutation: null,
            onMutationMouseOver: jest.fn(),
            selectedMutations: [],
            onMutationClick: jest.fn(),
            onlyShowSelectedInVAFChart: false,
            lineData: [
                [
                    {
                        color: '#111111',
                        mutation,
                        mutationStatus: 'Present',
                        sampleId: 'S-1',
                        x: 100,
                        y: 50,
                    },
                    {
                        color: '#111111',
                        mutation,
                        mutationStatus: 'Present',
                        sampleId: 'S-2',
                        x: 150,
                        y: 60,
                    },
                ],
            ],
            height: 200,
            width: 400,
        } as any;

        const instance = new (VAFChart as any)(props);
        const renderSummary = instance.renderSummary;

        expect(renderSummary.renderLines).toHaveLength(1);
        expect(renderSummary.renderLines[0]).toHaveLength(2);
        expect(renderSummary.renderLines[0][0].tooltipDatum.vafReport).toEqual({
            totalReadCount: 30,
            vaf: 1 / 3,
            variantReadCount: 10,
        });
        expect(renderSummary.renderLines[0][1].tooltipDatum.vafReport).toEqual({
            totalReadCount: 30,
            vaf: 1 / 3,
            variantReadCount: 10,
        });
        expect(getVariantAlleleFrequencySpy).toHaveBeenCalledTimes(1);

        getVariantAlleleFrequencySpy.mockRestore();
    });

    it('deduplicates highlighted mutations across selected and hovered inputs', () => {
        const mutation = {
            gene: { hugoGeneSymbol: 'TP53' },
            proteinChange: 'R175H',
        } as any;
        const props = {
            mouseOverMutation: mutation,
            onMutationMouseOver: jest.fn(),
            selectedMutations: [mutation],
            onMutationClick: jest.fn(),
            onlyShowSelectedInVAFChart: false,
            lineData: [],
            height: 200,
            width: 400,
        } as any;

        const instance = new (VAFChart as any)(props);

        expect(instance.highlightSummary.highlightedMutations).toEqual([
            mutation,
        ]);
    });

    it('suppresses selected-only highlights when the chart already filters to selected mutations', () => {
        const selectedMutation = {
            gene: { hugoGeneSymbol: 'TP53' },
            proteinChange: 'R175H',
        } as any;
        const hoveredMutation = {
            gene: { hugoGeneSymbol: 'EGFR' },
            proteinChange: 'L858R',
        } as any;
        const props = {
            mouseOverMutation: hoveredMutation,
            onMutationMouseOver: jest.fn(),
            selectedMutations: [selectedMutation],
            onMutationClick: jest.fn(),
            onlyShowSelectedInVAFChart: true,
            lineData: [],
            height: 200,
            width: 400,
        } as any;

        const instance = new (VAFChart as any)(props);

        expect(instance.highlightSummary.highlightedMutations).toEqual([
            hoveredMutation,
        ]);
    });

    it('reuses one tooltip-model handler across rendered points and connectors', () => {
        const mutation = {
            gene: { hugoGeneSymbol: 'TP53' },
            proteinChange: 'R175H',
            tumorAltCount: 10,
            tumorRefCount: 20,
        } as any;
        const props = {
            mouseOverMutation: null,
            onMutationMouseOver: jest.fn(),
            selectedMutations: [],
            onMutationClick: jest.fn(),
            onlyShowSelectedInVAFChart: false,
            lineData: [
                [
                    {
                        color: '#111111',
                        mutation,
                        mutationStatus: 'Present',
                        sampleId: 'S-1',
                        x: 100,
                        y: 50,
                    },
                    {
                        color: '#111111',
                        mutation,
                        mutationStatus: 'Present',
                        sampleId: 'S-2',
                        x: 150,
                        y: 60,
                    },
                ],
            ],
            height: 200,
            width: 400,
        } as any;

        const instance = new (VAFChart as any)(props);
        const svg = instance.render() as React.ReactElement;
        const renderedGroups = svg.props.children[0] as React.ReactElement[];
        const firstGroup = renderedGroups[0];
        const firstConnector = firstGroup.props.children[0] as React.ReactElement;
        const firstPoint = firstGroup.props.children[1] as React.ReactElement;
        const secondGroup = renderedGroups[1];
        const secondPoint = secondGroup.props.children[1] as React.ReactElement;

        expect(firstConnector.props.setTooltipModel).toBe(
            firstPoint.props.setTooltipModel
        );
        expect(firstPoint.props.setTooltipModel).toBe(
            secondPoint.props.setTooltipModel
        );
    });
});
