import * as React from 'react';
import {observer} from "mobx-react";
import {MSKTabs, MSKTab} from "shared/components/MSKTabs/MSKTabs";
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import MutationMapper from "./MutationMapper";

export interface IMutationsPageProps {
    routing: any;
    genes: string[];
    store: ResultsViewPageStore;
}

@observer
export default class Mutations extends React.Component<IMutationsPageProps, {}>
{
    constructor(props: IMutationsPageProps) {
        super(props);
        this.handleTabChange.bind(this);
    }

    public render() {
        return (
            <MSKTabs
                id="mutationsPageTabs"
                activeTabId={this.props.routing.location.query.mutationsGeneTab}
                onTabClick={(id:string) => this.handleTabChange(id)}
                className="mainTabs"
            >
                {this.generateTabs(this.props.genes)}
            </MSKTabs>
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
                            studyId={this.props.store.studyId}
                            store={mutationMapperStore}
                            discreteCNACache={this.props.store.discreteCNACache}
                            oncoKbEvidenceCache={this.props.store.oncoKbEvidenceCache}
                            pmidCache={this.props.store.pmidCache}
                            cancerTypeCache={this.props.store.cancerTypeCache}
                            mutationCountCache={this.props.store.mutationCountCache}
                            myCancerGenomeData={this.props.store.myCancerGenomeData}
                        />
                    </MSKTab>
                );
            }
        });

        return tabs;
    }
    
    protected handleTabChange(id: string) {
        this.props.routing.updateRoute({ mutationsGeneTab: id });
    }
}
