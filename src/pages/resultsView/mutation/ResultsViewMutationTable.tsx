import * as React from 'react';
import { observer } from 'mobx-react';
import {
    IMutationTableProps,
    MutationTableColumnType,
    default as MutationTable,
} from 'shared/components/mutationTable/MutationTable';
import CancerTypeColumnFormatter from 'shared/components/mutationTable/column/CancerTypeColumnFormatter';
import TumorAlleleFreqColumnFormatter from 'shared/components/mutationTable/column/TumorAlleleFreqColumnFormatter';
import { Mutation } from 'cbioportal-ts-api-client';
import { Mutation, ClinicalData } from 'shared/api/generated/CBioPortalAPI';
import ExonColumnFormatter from 'shared/components/mutationTable/column/ExonColumnFormatter';
import GnomadColumnFormatter from 'shared/components/mutationTable/column/GnomadColumnFormatter';
import { floatValueIsNA } from 'shared/lib/NumberUtils';
import { ASCNAttributes } from 'shared/enums/ASCNEnums'

export interface IResultsViewMutationTableProps extends IMutationTableProps {
    // add results view specific props here if needed
    totalNumberOfExons?: string;
}
//
@observer
export default class ResultsViewMutationTable extends MutationTable<
    IResultsViewMutationTableProps
> {
    constructor(props: IResultsViewMutationTableProps) {
        super(props);
    }

    public static defaultProps = {
        ...MutationTable.defaultProps,
        columns: [
            MutationTableColumnType.STUDY,
            MutationTableColumnType.SAMPLE_ID,
            MutationTableColumnType.COPY_NUM,
            MutationTableColumnType.ASCN_METHOD,
            MutationTableColumnType.ASCN_COPY_NUM,
            MutationTableColumnType.ANNOTATION,
            MutationTableColumnType.HGVSG,
            MutationTableColumnType.FUNCTIONAL_IMPACT,
            MutationTableColumnType.REF_READS_N,
            MutationTableColumnType.VAR_READS_N,
            MutationTableColumnType.REF_READS,
            MutationTableColumnType.VAR_READS,
            MutationTableColumnType.START_POS,
            MutationTableColumnType.END_POS,
            MutationTableColumnType.REF_ALLELE,
            MutationTableColumnType.VAR_ALLELE,
            MutationTableColumnType.MUTATION_STATUS,
            MutationTableColumnType.VALIDATION_STATUS,
            MutationTableColumnType.CENTER,
            MutationTableColumnType.CHROMOSOME,
            MutationTableColumnType.PROTEIN_CHANGE,
            MutationTableColumnType.MUTATION_TYPE,
            MutationTableColumnType.VARIANT_TYPE,
            MutationTableColumnType.CLONAL,
            MutationTableColumnType.CANCER_CELL_FRACTION,
            MutationTableColumnType.MUTANT_COPIES,
            MutationTableColumnType.COSMIC,
            MutationTableColumnType.TUMOR_ALLELE_FREQ,
            MutationTableColumnType.NORMAL_ALLELE_FREQ,
            MutationTableColumnType.CANCER_TYPE,
            MutationTableColumnType.NUM_MUTATIONS,
            MutationTableColumnType.EXON,
            MutationTableColumnType.HGVSC,
            MutationTableColumnType.GNOMAD,
            MutationTableColumnType.CLINVAR,
            MutationTableColumnType.DBSNP,
        ],
    };

    componentWillUpdate(nextProps: IResultsViewMutationTableProps) {
        this._columns[MutationTableColumnType.STUDY].visible = !!(
            nextProps.studyIdToStudy &&
            Object.keys(nextProps.studyIdToStudy).length > 1
        );
    }

    protected generateColumns() {
        super.generateColumns();

        // override default visibility for some columns
        this._columns[
            MutationTableColumnType.CANCER_TYPE
        ].visible = CancerTypeColumnFormatter.isVisible(
            this.props.dataStore
                ? this.props.dataStore.allData
                : this.props.data,
            this.props.uniqueSampleKeyToTumorType
        );
        this._columns[
            MutationTableColumnType.TUMOR_ALLELE_FREQ
        ].visible = TumorAlleleFreqColumnFormatter.isVisible(
            this.props.dataStore
                ? this.props.dataStore.allData
                : this.props.data
        );

        // order columns
        this._columns[MutationTableColumnType.STUDY].order = 0;
        this._columns[MutationTableColumnType.SAMPLE_ID].order = 10;
        this._columns[MutationTableColumnType.CANCER_TYPE].order = 15;
        this._columns[MutationTableColumnType.PROTEIN_CHANGE].order = 20;
        this._columns[MutationTableColumnType.ANNOTATION].order = 30;
        this._columns[MutationTableColumnType.HGVSG].order = 35;
        this._columns[MutationTableColumnType.FUNCTIONAL_IMPACT].order = 38;
        this._columns[MutationTableColumnType.MUTATION_TYPE].order = 40;
        this._columns[MutationTableColumnType.VARIANT_TYPE].order = 45;
        this._columns[MutationTableColumnType.ASCN_METHOD].order = 41;
        this._columns[MutationTableColumnType.CLONAL].order = 46;
        this._columns[MutationTableColumnType.CANCER_CELL_FRACTION].order = 47;
        this._columns[MutationTableColumnType.MUTANT_COPIES].order = 48;
        this._columns[MutationTableColumnType.COPY_NUM].order = 50;
        this._columns[MutationTableColumnType.ASCN_COPY_NUM].order = 51;
        this._columns[MutationTableColumnType.COSMIC].order = 60;
        this._columns[MutationTableColumnType.MUTATION_STATUS].order = 70;
        this._columns[MutationTableColumnType.VALIDATION_STATUS].order = 80;
        this._columns[MutationTableColumnType.CENTER].order = 100;
        this._columns[MutationTableColumnType.CHROMOSOME].order = 110;
        this._columns[MutationTableColumnType.START_POS].order = 120;
        this._columns[MutationTableColumnType.END_POS].order = 130;
        this._columns[MutationTableColumnType.REF_ALLELE].order = 140;
        this._columns[MutationTableColumnType.VAR_ALLELE].order = 150;
        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ].order = 160;
        this._columns[MutationTableColumnType.NORMAL_ALLELE_FREQ].order = 170;
        this._columns[MutationTableColumnType.VAR_READS].order = 180;
        this._columns[MutationTableColumnType.REF_READS].order = 190;
        this._columns[MutationTableColumnType.VAR_READS_N].order = 200;
        this._columns[MutationTableColumnType.REF_READS_N].order = 210;
        this._columns[MutationTableColumnType.NUM_MUTATIONS].order = 220;
        this._columns[MutationTableColumnType.EXON].order = 230;
        this._columns[MutationTableColumnType.HGVSC].order = 240;
        this._columns[MutationTableColumnType.GNOMAD].order = 260;
        this._columns[MutationTableColumnType.CLINVAR].order = 270;
        this._columns[MutationTableColumnType.DBSNP].order = 280;

        // exclude
        this._columns[
            MutationTableColumnType.CANCER_TYPE
        ].shouldExclude = () => {
            return !this.props.uniqueSampleKeyToTumorType;
        };

        this._columns[MutationTableColumnType.CLONAL].shouldExclude = () => {
            return !this.hasRequiredASCNProperty(ASCNAttributes.CCF_M_COPIES_STRING);
        };

        this._columns[
            MutationTableColumnType.ASCN_METHOD
        ].shouldExclude = () => {
            return !this.hasRequiredASCNProperty(ASCNAttributes.ASCN_METHOD_STRING);
        };

        this._columns[
            MutationTableColumnType.CANCER_CELL_FRACTION
        ].shouldExclude = () => {
            return !this.hasRequiredASCNProperty(ASCNAttributes.CCF_M_COPIES_STRING);
        };

        this._columns[
            MutationTableColumnType.MUTANT_COPIES
        ].shouldExclude = () => {
            return !this.hasRequiredASCNProperty(ASCNAttributes.MUTANT_COPIES_STRING);
        };

        this._columns[
            MutationTableColumnType.NUM_MUTATIONS
        ].shouldExclude = () => {
            return !this.props.mutationCountCache;
        };

        // customization for columns
        this._columns[MutationTableColumnType.EXON].render = (d: Mutation[]) =>
            ExonColumnFormatter.renderFunction(
                d,
                this.props.genomeNexusCache,
                false
            );
        this._columns[MutationTableColumnType.EXON].headerRender = () => (
            <span style={{ display: 'inline-block' }}>
                Exon
                <br />({this.props.totalNumberOfExons} in total)
            </span>
        );
    }
}
