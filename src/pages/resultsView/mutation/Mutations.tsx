import * as React from 'react';
import {observer} from "mobx-react";
import {MSKTabs, MSKTab} from "shared/components/MSKTabs/MSKTabs";
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import ResultsViewMutationMapper from "./ResultsViewMutationMapper";
import ResultsViewMutationMapperStore from "./ResultsViewMutationMapperStore";
import classnames from "classnames";
import {observable, computed} from "mobx";
import AppConfig from 'appConfig';
import "./mutations.scss";
import {filterCBioPortalWebServiceData} from '../../../shared/lib/oql/oqlfilter';
import AccessorsForOqlFilter from '../../../shared/lib/oql/AccessorsForOqlFilter';
import Loader from "../../../shared/components/loadingIndicator/LoadingIndicator";
import OqlStatusBanner from "../../../shared/components/oqlStatusBanner/OqlStatusBanner";
import autobind from "autobind-decorator";
import {AppStore} from "../../../AppStore";

export interface IMutationsPageProps {
    routing?: any;
    store: ResultsViewPageStore;
    appStore:AppStore;
}

@observer
export default class Mutations extends React.Component<IMutationsPageProps, {}>
{
    @observable mutationsGeneTab:string;

    constructor(props: IMutationsPageProps) {
        super(props);
        this.handleTabChange.bind(this);
        this.mutationsGeneTab = this.props.store.hugoGeneSymbols![0];
    }

    @autobind
    private onToggleOql() {
        this.props.store.mutationsTabShouldUseOql = !this.props.store.mutationsTabShouldUseOql;
    }

    public render() {
        // use routing if available, if not fall back to the observable variable
        const activeTabId = this.props.routing ?
            this.props.routing.location.query.mutationsGeneTab : this.mutationsGeneTab;

        return (
            <div data-test="mutationsTabDiv">
                <div className={"tabMessageContainer"}>
                    <OqlStatusBanner
                        className="mutations-oql-status-banner"
                        store={this.props.store}
                        tabReflectsOql={this.props.store.mutationsTabShouldUseOql}
                        isUnaffected={!this.props.store.queryContainsMutationOql}
                        onToggle={this.onToggleOql}
                    />
                </div>

                {(this.props.store.mutationMapperStores.isComplete) && (
                    <MSKTabs
                        id="mutationsPageTabs"
                        activeTabId={activeTabId}
                        onTabClick={(id:string) => this.handleTabChange(id)}
                        className="pillTabs resultsPageMutationsGeneTabs"
                        enablePagination={false}
                        arrowStyle={{'line-height': 0.8}}
                        tabButtonStyle="pills"
                        unmountOnHide={true}
                    >
                        {this.generateTabs(this.props.store.hugoGeneSymbols!)}
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
                const tabHasMutations = mutationMapperStore.mutations.length > 0;
                // gray out tab if no mutations
                const anchorStyle = tabHasMutations ? undefined : { color:'#bbb' };

                tabs.push(
                    <MSKTab key={gene} id={gene} linkText={gene} anchorStyle={anchorStyle}>
                        <ResultsViewMutationMapper
                            store={mutationMapperStore}
                            discreteCNACache={this.props.store.discreteCNACache}
                            oncoKbEvidenceCache={this.props.store.oncoKbEvidenceCache}
                            pubMedCache={this.props.store.pubMedCache}
                            cancerTypeCache={this.props.store.cancerTypeCache}
                            mutationCountCache={this.props.store.mutationCountCache}
                            genomeNexusCache={this.props.store.genomeNexusCache}
                            pdbHeaderCache={this.props.store.pdbHeaderCache}
                            myCancerGenomeData={this.props.store.myCancerGenomeData}
                            config={AppConfig.serverConfig}
                            userEmailAddress={this.props.appStore.userName!}
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
