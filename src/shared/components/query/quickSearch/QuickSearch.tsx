import * as React from "react";
import {observer} from "mobx-react";
import ReactSelect from "react-select";
import client from "shared/api/cbioportalClientInstance";
import QuickSearchOption from "./QuickSearchOption";
import {OptionType} from "./OptionType";
import autobind from 'autobind-decorator';
import "./styles.scss";
import getBrowserWindow from "shared/lib/getBrowserWindow";
import { sleep } from "shared/lib/TimeUtils";

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

@observer
export default class QuickSearch extends React.Component {

    private select: any;
    private studyPageMultiplier: number = 0;
    private genePageMultiplier: number = 0;
    private patientPageMultiplier: number = 0;

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

    @autobind
    private getOptions(input: string) {
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
                    options.push(...studyOptions);
                    if (studyCount.value > 0) {
                        options.push(studyCount);
                    }
                    options.push(...geneOptions);
                    if (geneCount.value > 0) {
                        options.push(geneCount);
                    }
                    options.push(...patientOptions);
                    if (patientCount.value > 0) {
                        options.push(patientCount);
                    }
                    return {options: options};
				});

		} else {
			return Promise.resolve();
		}
    }

    @autobind
    private handleChange(newOption: any) {

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
        } else {
            this.select.loadOptions(this.select.state.inputValue);
        }
    }

    @autobind
    private handleInputChange(inputValue: any) {
        if (inputValue != this.select.state.inputValue) {
            this.studyPageMultiplier = 0;
            this.genePageMultiplier = 0;
            this.patientPageMultiplier = 0;
        }
        return inputValue;
    }

    @autobind
    private renderInput(props: any) {
        delete props.value;
        return (
        <div className='Select-input' >
            <input placeholder="e.g. Lung, EGFR, TCGA-OR-A5J2" {...props}/>
        </div>
        )
    }
    
    render() {
        return (
            <ReactSelect.Async
                ref={this.selectRef}
                loadOptions={this.getOptions}
                onBlurResetsInput={false}
                placeholder={null}
                searchPromptText={false}
                loadingPlaceholder={false}
                filterOptions={false}
                optionComponent={QuickSearchOption}
                arrowRenderer={null}
                autoFocus={true}
                onCloseResetsInput={false}
                className="quick-search"
                onChange={this.handleChange}
                closeOnSelect={false}
                onSelectResetsInput={false}
                cache={false}
                onInputChange={this.handleInputChange}
                inputRenderer={this.renderInput}
            />
        );
    }
}
