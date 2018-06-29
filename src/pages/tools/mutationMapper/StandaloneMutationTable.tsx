import * as React from "react";
import {observer} from "mobx-react";
import {
    IMutationTableProps, MutationTableColumnType, default as MutationTable
} from "shared/components/mutationTable/MutationTable";
import TumorAlleleFreqColumnFormatter from "shared/components/mutationTable/column/TumorAlleleFreqColumnFormatter";
import CancerTypeColumnFormatter from "shared/components/mutationTable/column/CancerTypeColumnFormatter";

export interface IStandaloneMutationTableProps extends IMutationTableProps {
    // add standalone specific props here if needed
}

@observer
export default class StandaloneMutationTable extends MutationTable<IStandaloneMutationTableProps> {

    constructor(props: IStandaloneMutationTableProps) {
        super(props);
    }

    public static defaultProps =
    {
        ...MutationTable.defaultProps,
        columns: [
            MutationTableColumnType.SAMPLE_ID,
            MutationTableColumnType.CANCER_TYPE,
            MutationTableColumnType.ANNOTATION,
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
            MutationTableColumnType.TUMOR_ALLELE_FREQ,
            MutationTableColumnType.NORMAL_ALLELE_FREQ
        ]
    };

    protected generateColumns() {
        super.generateColumns();

        // override default visibility for some columns
        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ].visible = TumorAlleleFreqColumnFormatter.isVisible(
            this.props.dataStore ? this.props.dataStore.allData : this.props.data);
        this._columns[MutationTableColumnType.CANCER_TYPE].visible = CancerTypeColumnFormatter.isVisible(
            this.props.dataStore ? this.props.dataStore.allData : this.props.data,
            this.props.uniqueSampleKeyToTumorType);
        this._columns[MutationTableColumnType.FUNCTIONAL_IMPACT].visible = true;

        // order columns
        //this._columns[MutationTableColumnType.STUDY].order = 0;
        this._columns[MutationTableColumnType.SAMPLE_ID].order = 10;
        this._columns[MutationTableColumnType.CANCER_TYPE].order = 15;
        this._columns[MutationTableColumnType.PROTEIN_CHANGE].order = 20;
        this._columns[MutationTableColumnType.ANNOTATION].order = 30;
        this._columns[MutationTableColumnType.FUNCTIONAL_IMPACT].order = 38;
        this._columns[MutationTableColumnType.MUTATION_TYPE].order = 40;
        //this._columns[MutationTableColumnType.COPY_NUM].order = 50;
        //this._columns[MutationTableColumnType.COSMIC].order = 60;
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
        //this._columns[MutationTableColumnType.NUM_MUTATIONS].order = 220;
    }
}
