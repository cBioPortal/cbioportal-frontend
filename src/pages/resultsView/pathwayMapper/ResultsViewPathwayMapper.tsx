import * as React from "react";
import * as _ from "lodash";
import $ from "jquery";
import { QueryParameter } from "../../../shared/lib/ExtendedRouterStore";
import {ResultsViewPageStore, SamplesSpecificationElement, IQueriedMergedTrackCaseData, IQueriedCaseData} from "../ResultsViewPageStore";
import { ResultsViewTab } from "../ResultsViewPageHelpers";
import { generateGeneAlterationData } from "../download/DownloadUtils";
import PathwayMapper, {ICBioData} from "react-pathway-mapper";
import "react-pathway-mapper/dist/base.css";
import PathwayMapperTable, { IPathwayMapperTable } from "./PathwayMapperTable";
import { observer } from "mobx-react";
import autobind from "autobind-decorator";
import { observable, ObservableMap } from "mobx";
import { alterationInfoForOncoprintTrackData } from "shared/components/oncoprint/OncoprintUtils";
import { isMergedTrackFilter } from "shared/lib/oql/oqlfilter";
import { Sample, Patient, MolecularProfile } from "shared/api/generated/CBioPortalAPI";
import { makeGeneticTrackData } from "shared/components/oncoprint/DataUtils";
import { CoverageInformation } from "../ResultsViewPageStoreUtils";
interface IResultsViewPathwayMapperProps{
    store: ResultsViewPageStore;
    storeForAllData: ResultsViewPageStore;
}

@observer
export default class ResultsViewPathwayMapper extends React.Component<IResultsViewPathwayMapperProps, {}>{
    

    @observable
    tableData: IPathwayMapperTable[];

    @observable
    cBioData: ICBioData[];

    constructor(props: IResultsViewPathwayMapperProps){
        super(props);
        this.cBioData = [];
        this.tableData = [];
    }

    render(){
        /*const data = generateGeneAlterationData(
            this.props.storeForAllData.oqlFilteredCaseAggregatedDataByOQLLine.result!,
            this.props.storeForAllData.sequencedSampleKeysByGene.result!);*/

            
        this.props.storeForAllData.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach( (alterationData, trackIndex) => {

            this.getOncoData(this.props.storeForAllData.samples.result,
                             this.props.storeForAllData.patients.result,
                             this.props.storeForAllData.coverageInformation.result,
                             this.props.storeForAllData.sequencedSampleKeysByGene.result!,
                             this.props.storeForAllData.sequencedPatientKeysByGene.result!,
                             this.props.storeForAllData.selectedMolecularProfiles.result!,
                             alterationData);
        }
        )
        return(

            <div>
                <PathwayMapperTable data={this.tableData}/>
                <PathwayMapper isCBioPortal={true} isCollaborative={false} 
                                genes={this.props.store.genes.result as any}
                                cBioAlterationData={this.cBioData}
                                queryParameter={QueryParameter.GENE_LIST}
                                oncoPrintTab={ResultsViewTab.ONCOPRINT}
                                setTableData={this.setTableData}/>
            </div>);
    }

    @autobind
    setTableData(bestPathwayAlgos: any[][]){
        this.tableData = bestPathwayAlgos[0].map((data: any) => ({name: data.pathwayName, score: data.score, genes: data.genesMatched}));
    }

    
    getOncoData(
        samples: Pick<Sample, 'sampleId'|'studyId'|'uniqueSampleKey'>[],
        patients: Pick<Patient, 'patientId'|'studyId'|'uniquePatientKey'>[],
        coverageInformation: CoverageInformation,
        sequencedSampleKeysByGene: any,
        sequencedPatientKeysByGene: any,
        selectedMolecularProfiles: MolecularProfile[],
        caseData:IQueriedMergedTrackCaseData | (IQueriedCaseData<any> & { mergedTrackOqlList?:never })){
        
        const sampleMode = false;
        const oql = caseData.oql;
        const geneSymbolArray = (isMergedTrackFilter(oql)
            ? oql.list.map(({gene}) => gene)
            : [oql.gene]
        );
        const dataByCase = caseData.cases;
        const data = makeGeneticTrackData(dataByCase.patients, geneSymbolArray, patients as Patient[], coverageInformation, selectedMolecularProfiles);

        const alterationInfo = alterationInfoForOncoprintTrackData(
            sampleMode,
            {trackData: data, oql: geneSymbolArray},
            sequencedSampleKeysByGene,
            sequencedPatientKeysByGene
        );

        // console.log(alterationInfo);
        // console.log(oql);
        this.cBioData.push({gene: (oql as any).gene, altered: alterationInfo.altered, sequenced: alterationInfo.sequenced, percentAltered: alterationInfo.percent});
    }
}