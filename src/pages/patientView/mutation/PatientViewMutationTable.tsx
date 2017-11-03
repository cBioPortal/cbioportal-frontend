import * as React from "react";
import {computed} from "mobx";
import {observer} from "mobx-react";
import {
    IMutationTableProps, MutationTableColumnType, default as MutationTable
} from "shared/components/mutationTable/MutationTable";
import SampleManager from "../sampleManager";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import AlleleCountColumnFormatter from "shared/components/mutationTable/column/AlleleCountColumnFormatter";
import AlleleFreqColumnFormatter from "./column/AlleleFreqColumnFormatter";
import TumorColumnFormatter from "./column/TumorColumnFormatter";
import {isUncalled} from "shared/lib/MutationUtils";
import TumorAlleleFreqColumnFormatter from "shared/components/mutationTable/column/TumorAlleleFreqColumnFormatter";

export interface IPatientViewMutationTableProps extends IMutationTableProps {
    sampleManager:SampleManager | null;
    sampleIds?:string[];
}

@observer
export default class PatientViewMutationTable extends MutationTable<IPatientViewMutationTableProps> {

    constructor(props:IPatientViewMutationTableProps) {
        super(props);
    }

    public static defaultProps =
    {
        ...MutationTable.defaultProps,
        initialItemsPerPage: 10,
        paginationProps:{ itemsPerPageOptions:[10,25,50,100] },
        columns: [
            MutationTableColumnType.COHORT,
            MutationTableColumnType.MRNA_EXPR,
            MutationTableColumnType.COPY_NUM,
            MutationTableColumnType.ANNOTATION,
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
            MutationTableColumnType.GENE,
            MutationTableColumnType.CHROMOSOME,
            MutationTableColumnType.PROTEIN_CHANGE,
            MutationTableColumnType.MUTATION_TYPE,
            MutationTableColumnType.FUNCTIONAL_IMPACT,
            MutationTableColumnType.COSMIC,
            MutationTableColumnType.TUMOR_ALLELE_FREQ,
            MutationTableColumnType.TUMORS
        ]
    };

    protected getSamples():string[] {
        if (this.props.sampleIds) {
            return this.props.sampleIds;
        }
        else {
            return [];
        }
    }

    protected generateColumns() {
        super.generateColumns();

        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ] = {
            name: "Allele Freq",
            render: (d:Mutation[])=>AlleleFreqColumnFormatter.renderFunction(d, this.props.sampleManager),
            sortBy:(d:Mutation[])=>AlleleFreqColumnFormatter.getSortValue(d, this.props.sampleManager),
            download: (d:Mutation[])=>AlleleFreqColumnFormatter.getFrequency(d),
            tooltip:(<span>Variant allele frequency in the tumor sample</span>),
            visible: AlleleFreqColumnFormatter.isVisible(this.props.sampleManager,
                this.props.dataStore ? this.props.dataStore.allData : this.props.data)
        };

        this._columns[MutationTableColumnType.TUMORS] = {
            name: "Tumors",
            render:(d:Mutation[])=>TumorColumnFormatter.renderFunction(d, this.props.sampleManager),
            sortBy:(d:Mutation[])=>TumorColumnFormatter.getSortValue(d, this.props.sampleManager),
            download: (d:Mutation[])=>TumorColumnFormatter.getSample(d),
        };

        // customization for allele count columns

        this._columns[MutationTableColumnType.REF_READS_N].render =
            (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "normalRefCount");
        this._columns[MutationTableColumnType.REF_READS_N].download =
            (d:Mutation[])=>AlleleCountColumnFormatter.getReads(d, "normalRefCount");

        this._columns[MutationTableColumnType.VAR_READS_N].render =
            (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "normalAltCount");
        this._columns[MutationTableColumnType.VAR_READS_N].download =
            (d:Mutation[])=>AlleleCountColumnFormatter.getReads(d, "normalAltCount");

        this._columns[MutationTableColumnType.REF_READS].render =
            (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "tumorRefCount");
        this._columns[MutationTableColumnType.REF_READS].download =
            (d:Mutation[])=>AlleleCountColumnFormatter.getReads(d, "tumorRefCount");

        this._columns[MutationTableColumnType.VAR_READS].render =
            (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "tumorAltCount");
        this._columns[MutationTableColumnType.VAR_READS].download =
            (d:Mutation[])=>AlleleCountColumnFormatter.getReads(d, "tumorAltCount");


        // order columns
        this._columns[MutationTableColumnType.TUMORS].order = 5;
        this._columns[MutationTableColumnType.GENE].order = 20;
        this._columns[MutationTableColumnType.PROTEIN_CHANGE].order = 30;
        this._columns[MutationTableColumnType.ANNOTATION].order = 35;
        this._columns[MutationTableColumnType.FUNCTIONAL_IMPACT].order = 38;
        this._columns[MutationTableColumnType.CHROMOSOME].order = 40;
        this._columns[MutationTableColumnType.START_POS].order = 50;
        this._columns[MutationTableColumnType.END_POS].order = 60;
        this._columns[MutationTableColumnType.REF_ALLELE].order = 70;
        this._columns[MutationTableColumnType.VAR_ALLELE].order = 80;
        this._columns[MutationTableColumnType.MUTATION_STATUS].order = 90;
        this._columns[MutationTableColumnType.VALIDATION_STATUS].order = 100;
        this._columns[MutationTableColumnType.MUTATION_TYPE].order = 110;
        this._columns[MutationTableColumnType.CENTER].order = 120;
        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ].order = 130;
        this._columns[MutationTableColumnType.VAR_READS].order = 140;
        this._columns[MutationTableColumnType.REF_READS].order = 150;
        this._columns[MutationTableColumnType.VAR_READS_N].order = 170;
        this._columns[MutationTableColumnType.REF_READS_N].order = 180;
        this._columns[MutationTableColumnType.COPY_NUM].order = 181;
        this._columns[MutationTableColumnType.MRNA_EXPR].order = 182;
        this._columns[MutationTableColumnType.COHORT].order = 183;
        this._columns[MutationTableColumnType.COSMIC].order = 184;

        // exclusions
        this._columns[MutationTableColumnType.MRNA_EXPR].shouldExclude = ()=>{
            return (!this.props.mrnaExprRankMolecularProfileId) || (this.getSamples().length > 1);
        };
        // only hide tumor column if there is one sample and no uncalled
        // mutations (there is no information added in that case by the sample
        // label)
        this._columns[MutationTableColumnType.TUMORS].shouldExclude = ()=>{
            return this.getSamples().length < 2 && !this.hasUncalledMutations;
        };
        this._columns[MutationTableColumnType.COPY_NUM].shouldExclude = ()=>{
            return (!this.props.discreteCNAMolecularProfileId) || (this.getSamples().length > 1);
        };
    }

    @computed private get hasUncalledMutations():boolean {
        let data:Mutation[][] = [];
        if (this.props.data) {
            data = this.props.data;
        } else if (this.props.dataStore) {
            data = this.props.dataStore.allData;
        }
        return data.some((row:Mutation[]) => {
            return row.some((m:Mutation) => {
                return isUncalled(m.molecularProfileId);
            });
        });
    }
}
