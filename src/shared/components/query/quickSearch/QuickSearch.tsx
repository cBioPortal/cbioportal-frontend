import * as React from "react";
import {observer} from "mobx-react";
import Select, { components } from 'react-select2';
import client from "shared/api/cbioportalClientInstance";
import {OptionType} from "./OptionType";
import autobind from 'autobind-decorator';
import "./styles.scss";
import getBrowserWindow from "shared/lib/getBrowserWindow";
import { sleep } from "shared/lib/TimeUtils";
import { Label } from 'react-bootstrap';
import * as moduleStyles from "./styles.module.scss";
import {action, computed, observable, runInAction} from "mobx";
import {remoteData} from "../../../api/remoteData";

export const SHOW_MORE_SIZE: number = 20;
const DEFAULT_PAGE_SIZE: number = 3;

const ALL_TCGA_PANCANCER_STUDIES: string = "laml_tcga_pan_can_atlas_2018,acc_tcga_pan_can_atlas_2018,blca_tcga_pan_can_atlas_2018," + 
    "lgg_tcga_pan_can_atlas_2018,brca_tcga_pan_can_atlas_2018,cesc_tcga_pan_can_atlas_2018,chol_tcga_pan_can_atlas_2018," + 
    "coadread_tcga_pan_can_atlas_2018,dlbc_tcga_pan_can_atlas_2018,esca_tcga_pan_can_atlas_2018,gbm_tcga_pan_can_atlas_2018," + 
    "hnsc_tcga_pan_can_atlas_2018,kich_tcga_pan_can_atlas_2018,kirc_tcga_pan_can_atlas_2018,kirp_tcga_pan_can_atlas_2018," + 
    "lihc_tcga_pan_can_atlas_2018,luad_tcga_pan_can_atlas_2018,lusc_tcga_pan_can_atlas_2018,meso_tcga_pan_can_atlas_2018," + 
    "ov_tcga_pan_can_atlas_2018,paad_tcga_pan_can_atlas_2018,pcpg_tcga_pan_can_atlas_2018,prad_tcga_pan_can_atlas_2018," + 
    "sarc_tcga_pan_can_atlas_2018,skcm_tcga_pan_can_atlas_2018,stad_tcga_pan_can_atlas_2018," + 
    "tgct_tcga_pan_can_atlas_2018,thym_tcga_pan_can_atlas_2018,thca_tcga_pan_can_atlas_2018,ucs_tcga_pan_can_atlas_2018," +
    "ucec_tcga_pan_can_atlas_2018,uvm_tcga_pan_can_atlas_2018";

type OptionData = {
    value: number;
    type: string;
    hugoGeneSymbol: string;
    cytoband: string;
    index: number;
}


@observer
export default class QuickSearch extends React.Component {

    private select: any;
    @observable private studyPageMultiplier: number = 0;
    @observable private genePageMultiplier: number = 0;
    @observable private patientPageMultiplier: number = 0;

    @observable private inputValue:string = "";
    @observable private menuIsOpen:boolean = false;
    @observable private isLoading = false;

    @autobind
    private selectRef(select: any) {
        this.select = select;
    }

    private studyToOption(study:any, index: number) {
        return {
            value: study.studyId,
            type: OptionType.STUDY,
            studyId: study.studyId,
            name: study.name,
            allSampleCount: study.allSampleCount,
            index: index
        };
    }

    private geneToOption(gene:any, index:number) {
        return {
            value: gene.entrezGeneId,
            type: OptionType.GENE,
            hugoGeneSymbol: gene.hugoGeneSymbol,
            cytoband: gene.cytoband,
            index: index
        };
    }

    private patientToOption(patient:any, index:number) {
        return {
            value: patient.uniquePatientKey,
            type: OptionType.PATIENT,
            studyId: patient.studyId,
            patientId: patient.patientId,
            studyName: patient.cancerStudy.name,
            index: index
        }
    }

    private options = remoteData<any[]>(()=>{

        const input = this.inputValue;

        if (input.length > 0) {
            return Promise.all([
                client.getAllStudiesUsingGETWithHttpInfo({keyword: input, pageSize: DEFAULT_PAGE_SIZE + (SHOW_MORE_SIZE * this.studyPageMultiplier)}),
                client.getAllStudiesUsingGETWithHttpInfo({keyword: input, projection: "META"}),
                client.getAllGenesUsingGETWithHttpInfo({keyword: input, pageSize: DEFAULT_PAGE_SIZE + (SHOW_MORE_SIZE * this.genePageMultiplier)}),
                client.getAllGenesUsingGETWithHttpInfo({keyword: input, projection: "META"}),
                client.getAllPatientsUsingGETWithHttpInfo({keyword: input, pageSize: DEFAULT_PAGE_SIZE + (SHOW_MORE_SIZE * this.patientPageMultiplier), projection: "DETAILED"}),
                client.getAllPatientsUsingGETWithHttpInfo({keyword: input, projection: "META"}),
                // we use sleep method because if the response is cached by superagent, react-select can't render the options for some reason
                sleep(0)]).then(async (response: any) => {
                let studyOptions: any = response[0].body.map(this.studyToOption);

                let studyCount = {
                    value: parseInt(response[1].headers["total-count"]) - studyOptions.length,
                    type: OptionType.STUDY_COUNT
                }
                const geneOptions: any = response[2].body.map(this.geneToOption);
                const geneCount = {
                    value: parseInt(response[3].headers["total-count"]) - geneOptions.length,
                    type: OptionType.GENE_COUNT
                }
                const patientOptions: any = response[4].body.map(this.patientToOption);
                const patientCount = {
                    value: parseInt(response[5].headers["total-count"]) - patientOptions.length,
                    type: OptionType.PATIENT_COUNT
                }

                if (((geneOptions.length + patientOptions.length) < (2 * DEFAULT_PAGE_SIZE)) && studyCount.value > 0) {
                    const spillover = (2 * DEFAULT_PAGE_SIZE) - (geneOptions.length + patientOptions.length);
                    await client.getAllStudiesUsingGETWithHttpInfo({keyword: input,
                        pageSize: spillover + DEFAULT_PAGE_SIZE + (SHOW_MORE_SIZE * this.studyPageMultiplier)})
                        .then((response: any) => {
                            studyOptions = response.body.map(this.studyToOption);
                        });
                    studyCount.value = studyCount.value - spillover;
                }

                let options = [];

                let groupedOptions = [];

                groupedOptions.push({ label:"Studies", options:studyOptions, groupData:studyCount, instruction:"Click on a study to open its summary" });
                if (studyCount.value > 0) {
                    studyOptions.push(studyCount);
                    options.push(studyCount);
                }

                groupedOptions.push({ label:"Genes", options:geneOptions, groupData:geneCount, instruction:"Click on a gene to query it across all TCGA PanCancer Atlas studies" });
                if (geneCount.value > 0) {
                    geneOptions.push(geneCount);
                    options.push(geneCount);
                }

                groupedOptions.push({ label:"Patients", options:patientOptions, groupData:patientCount, instruction:"Click on a patient to see a summary" });
                if (patientCount.value > 0) {
                    patientOptions.push(patientCount);
                    options.push(patientCount);
                }

                return groupedOptions;
            });

        } else {
            return Promise.resolve([]);
        }

    });

    @autobind
    @action
    private handleChange(newOption:any) {

        let parameters;
        let route;
        if (newOption.type === OptionType.STUDY) {
            parameters = {id: newOption.studyId};
            route = "study";
        } else if (newOption.type === OptionType.GENE) {
            parameters ={case_set_id: 'all', gene_list: newOption.hugoGeneSymbol, cancer_study_list: ALL_TCGA_PANCANCER_STUDIES};
            route = "results/mutations";
        } else if (newOption.type === OptionType.PATIENT) {
            parameters = {studyId: newOption.studyId, caseId: newOption.patientId};
            route = "patient";
        } else if (newOption.type === OptionType.STUDY_COUNT) {
            this.studyPageMultiplier++;
        } else if (newOption.type === OptionType.GENE_COUNT) {
            this.genePageMultiplier++;
        } else if (newOption.type === OptionType.PATIENT_COUNT) {
            this.patientPageMultiplier++;
        }

        if (route) {
            getBrowserWindow().routingStore.updateRoute(parameters, route);
        }
    }

    @autobind
    private handleInputChange(inputValue:any, { action }: { action:any} ) {
        if (action !== 'set-value'){
            this.menuIsOpen = inputValue.length > 0;
            // if user has changed search query then
            // we should return the results multipliers to zero
            if (inputValue != this.inputValue) {
                this.studyPageMultiplier = 0;
                this.genePageMultiplier = 0;
                this.patientPageMultiplier = 0;
            }
            this.inputValue = inputValue;
        }
    }

    @autobind
    private renderInput(props: any) {
        delete props.value;
        console.log(props);
        return (
        <div className='Select-input' >
            <input placeholder="e.g. Lung, EGFR, TCGA-OR-A5J2" {...props}/>
        </div>
        )
    }

    render() {

        return (
            <div>
                <Select
                    options={this.options.result || []}
                    autoFocus={true}
                    onInputChange={this.handleInputChange}
                    onChange={this.handleChange}
                    components={{ Group, GroupHeading }}
                    formatOptionLabel={formatMyLabel}
                    controlShouldRenderValue={false}
                    filterOption={false}
                    inputValue={this.inputValue}
                    isLoading={this.options.isPending}
                    placeholder={"e.g. Lung, EGFR, TCGA-OR-A5J2"}
                    blurInputOnSelect={false}
                    closeMenuOnSelect={false}
                    onSelectResetsInput={false}
                    menuIsOpen={this.menuIsOpen}
                    maxMenuHeight={510}
                    styles={{
                        dropdownIndicator: ()=>{ return { display:'none' } },
                        control: (provided:any)=>{ return { ...provided, cursor:'text' } }
                    }}
                />
                <p style={{fontSize:"x-small",textAlign:"center",paddingTop:15}}>
                    We would love to hear what you think:&nbsp;
                    <a href="mailto:cbioportal@googlegroups.com">
                        cbioportal@googlegroups.com
                    </a>
                </p>
            </div>
        );
    }
}


const DropdownIndicator = (
    props: any
) => {
    return null
};

const Group = (props:any) => {

    const groupData:any = props.data.groupData;

    const label = groupData.value + " more " + groupData.type + " (click to load " +
        (groupData.value < SHOW_MORE_SIZE ? groupData.value: SHOW_MORE_SIZE) + " more)";

    return  <div className={moduleStyles.optionGroup}>
                <div className={moduleStyles.groupHeader}>
                    {props.data.instruction}
                </div>
                <components.Group {...props}/>

            </div>
};


const GroupHeading = (props:any) => {
   return null;
};


function formatMyLabel(data:any){

    let label, typeStyle, details, clickInfo;

    if (data.type === OptionType.STUDY) {
        label = data.name;
        typeStyle = "primary";
        details = data.allSampleCount + " samples";
        clickInfo = "Select a study to open its summary";
    } else if (data.type === OptionType.GENE) {
        label = data.hugoGeneSymbol;
        typeStyle = "success";
        details = data.cytoband || "-";
        clickInfo = "Select a gene to query it across all TCGA PanCancer Atlas studies";
    } else if (data.type === OptionType.PATIENT) {
        label = data.patientId;
        typeStyle = "danger";
        details = data.studyName;
        clickInfo = "Select a patient to see a summary";
    } else {
        label = data.value + " more " + data.type + " (click to load " +
            (data.value < SHOW_MORE_SIZE ? data.value : SHOW_MORE_SIZE) + " more)";
    }

    return <div className={moduleStyles.optionWrapper}>
                {
                    (typeStyle) && <div className={moduleStyles.optionLabelWrapper}><Label bsStyle={typeStyle}>{data.type}</Label></div>
                }
                <div>
                    <div><strong>{label}</strong></div>
                    {
                        (details) && <small>{details}</small>
                    }
                </div>
            </div>
}