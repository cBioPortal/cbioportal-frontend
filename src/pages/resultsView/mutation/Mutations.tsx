import * as React from 'react';
import {observer} from "mobx-react";
import {MSKTabs, MSKTab} from "shared/components/MSKTabs/MSKTabs";
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import MutationMapper from "./MutationMapper";
import {observable, computed} from "mobx";
import AppConfig from 'appConfig';
import "./mutations.scss";
import {filterCBioPortalWebServiceData} from '../../../shared/lib/oql/oqlfilter';
import accessors from '../../../shared/lib/oql/accessors';
import Loader from "../../../shared/components/loadingIndicator/LoadingIndicator";

export interface IMutationsPageProps {
    routing?: any;
    genes: string[];
    store: ResultsViewPageStore;
}

@observer
export default class Mutations extends React.Component<IMutationsPageProps, {}>
{
    @observable mutationsGeneTab:string;

    constructor(props: IMutationsPageProps) {
        super(props);
        this.handleTabChange.bind(this);
        this.mutationsGeneTab = props.genes[0];
    }


    public render() {
        // use routing if available, if not fall back to the observable variable
        const activeTabId = this.props.routing ?
            this.props.routing.location.query.mutationsGeneTab : this.mutationsGeneTab;

        return (
            <div>
                <Loader isLoading={this.props.store.mutationMapperStores.isPending} />
                {(this.props.store.mutationMapperStores.isComplete) && (
                    <MSKTabs
                        id="mutationsPageTabs"
                        activeTabId={activeTabId}
                        onTabClick={(id:string) => this.handleTabChange(id)}
                        className="secondaryTabs resultsPageMutationsGeneTabs"
                        enablePagination={true}
                        arrowStyle={{'line-height':.8}}
                        tabButtonStyle="pills"
                    >
                        {this.generateTabs(this.props.genes)}
                    </MSKTabs>
                )}
            </div>
        );
    }
    
    protected generateTabs(genes: string[])
    {
        const tabs: JSX.Element[] = [];

        genes.forEach((gene: string) => {
            const mutationMapperStore = this.props.store.getMutationMapperStore(gene);

            if (mutationMapperStore)
            {
                tabs.push(
                    <MSKTab key={gene} id={gene} linkText={gene}>
                        <MutationMapper
                            store={mutationMapperStore}
                            discreteCNACache={this.props.store.discreteCNACache}
                            genomeNexusEnrichmentCache={this.props.store.genomeNexusEnrichmentCache}
                            oncoKbEvidenceCache={this.props.store.oncoKbEvidenceCache}
                            pubMedCache={this.props.store.pubMedCache}
                            cancerTypeCache={this.props.store.cancerTypeCache}
                            mutationCountCache={this.props.store.mutationCountCache}
                            pdbHeaderCache={this.props.store.pdbHeaderCache}
                            myCancerGenomeData={this.props.store.myCancerGenomeData}
                            config={AppConfig}
                        />
                    </MSKTab>
                );
            }
        });

        return tabs;
    }
    
    protected handleTabChange(id: string) {
        // update the hash if routing exits
        if (this.props.routing) {
            this.props.routing.updateRoute({ mutationsGeneTab: id });
        }
        // update the observable if no routing
        else {
            this.mutationsGeneTab = id;
        }
    }
}
