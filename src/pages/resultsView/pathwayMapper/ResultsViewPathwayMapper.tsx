import * as React from "react";
import * as _ from "lodash";
import $ from "jquery";
import { QueryParameter } from "../../../shared/lib/ExtendedRouterStore";
import {ResultsViewPageStore, SamplesSpecificationElement} from "../ResultsViewPageStore";
import { ResultsViewTab } from "../ResultsViewPageHelpers";
import { generateGeneAlterationData } from "../download/DownloadUtils";
import PathwayMapper from "react-pathway-mapper";
import "react-pathway-mapper/dist/base.css";
import PathwayMapperTable from "./PathwayMapperTable";
import { observer } from "mobx-react";
interface IResultsViewPathwayMapperProps{
    store: ResultsViewPageStore;
    storeForAllData: ResultsViewPageStore;
}

@observer
export default class ResultsViewPathwayMapper extends React.Component<IResultsViewPathwayMapperProps, {}>{

    constructor(props: IResultsViewPathwayMapperProps){
        super(props);
    }

    render(){
        const data = generateGeneAlterationData(
            this.props.storeForAllData.oqlFilteredCaseAggregatedDataByOQLLine.result!,
            this.props.storeForAllData.sequencedSampleKeysByGene.result!);
        return(

            <div>
                <PathwayMapperTable data={[{name: "ABC", score: 10, genes: ["MDM2", "CDKN2A"]}]}/>
                <PathwayMapper isCBioPortal={true} isCollaborative={false} 
                                genes={this.props.store.genes.result as any}
                                cBioAlterationData={data}
                                queryParameter={QueryParameter.GENE_LIST}
                                oncoPrintTab={ResultsViewTab.ONCOPRINT}/>
            </div>);
    }
}