import { assert } from 'chai';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { GeneticEntity } from 'shared/model/GeneticEntity';
import CoExpressionPlot, {
    CoExpressionPlotData,
    ICoExpressionPlotProps,
} from './CoExpressionPlot';

const RNA_SEQ = {
    molecularProfileId: 'brca_tcga_pan_can_atlas_2018_rna_seq_v2_mrna',
    name:
        'mRNA Expression, RSEM (Batch normalized from Illumina HiSeq_RNASeqV2)',
} as MolecularProfile;

const RPPA = {
    molecularProfileId: 'brca_tcga_pan_can_atlas_2018_rppa',
    name: 'Protein expression (RPPA)',
} as MolecularProfile;

function datum(sampleId: string, x: number, y: number): CoExpressionPlotData {
    return {
        x,
        y,
        mutationsX: '',
        mutationsY: '',
        profiledX: true,
        profiledY: true,
        studyId: 'brca_tcga_pan_can_atlas_2018',
        sampleId,
    };
}

function makePlot(
    molecularProfileX: MolecularProfile,
    molecularProfileY: MolecularProfile,
    logScale: boolean
) {
    const props: ICoExpressionPlotProps = {
        xAxisGeneticEntity: {
            geneticEntityName: 'ESR1',
            cytoband: '6q25.1-q25.2',
        } as GeneticEntity,
        yAxisGeneticEntity: {
            geneticEntityName: 'PGR',
            cytoband: '11q22.1',
        } as GeneticEntity,
        // RPPA values are log2 ratios, so most of them are negative
        data: [datum('S1', 1024, -0.5), datum('S2', 64, 0.8)],
        molecularProfileX,
        molecularProfileY,
        height: 500,
        width: 500,
        logScale,
        showRegressionLine: false,
        handlers: { onClickShowRegressionLine: () => {} },
    };
    return new CoExpressionPlot(props);
}

function renderedScatterPlot(plot: CoExpressionPlot) {
    return (plot as any).plot();
}

describe('CoExpressionPlot', () => {
    describe('log scale with an RNA-seq and a non-RNA-seq profile', () => {
        it('log-transforms only the RNA-seq axis', () => {
            const scatterPlot = renderedScatterPlot(
                makePlot(RNA_SEQ, RPPA, true)
            );
            assert.isDefined(scatterPlot.props.logX);
            assert.isUndefined(scatterPlot.props.logY);
        });

        it('log-transforms only the RNA-seq axis when it is on y', () => {
            const scatterPlot = renderedScatterPlot(
                makePlot(RPPA, RNA_SEQ, true)
            );
            assert.isUndefined(scatterPlot.props.logX);
            assert.isDefined(scatterPlot.props.logY);
        });

        it('labels only the RNA-seq axis as log2', () => {
            const plot = makePlot(RNA_SEQ, RPPA, true);
            assert.include(plot.axisLabelX, '(log2)');
            assert.notInclude(plot.axisLabelY, '(log2)');
        });
    });

    it('log-transforms both axes when both profiles are RNA-seq', () => {
        const scatterPlot = renderedScatterPlot(
            makePlot(RNA_SEQ, RNA_SEQ, true)
        );
        assert.isDefined(scatterPlot.props.logX);
        assert.isDefined(scatterPlot.props.logY);
    });

    it('transforms neither axis when log scale is off', () => {
        const scatterPlot = renderedScatterPlot(makePlot(RNA_SEQ, RPPA, false));
        assert.isUndefined(scatterPlot.props.logX);
        assert.isUndefined(scatterPlot.props.logY);
    });
});
