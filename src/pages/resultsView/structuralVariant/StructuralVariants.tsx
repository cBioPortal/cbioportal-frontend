import * as React from 'react';
import { observer } from 'mobx-react';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { action, computed } from 'mobx';
import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import ResultsViewStructuralVariantMapper from './ResultsViewStructuralVariantMapper';
import autobind from 'autobind-decorator';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';

export interface IStructuralVariantPageProps {
    store: ResultsViewPageStore;
    urlWrapper: ResultsViewURLWrapper;
}

@autobind
@observer
export default class StructuralVariants extends React.Component<
    IStructuralVariantPageProps,
    {}
> {
    @computed get generateTabs(): JSX.Element[] {
        const tabs: JSX.Element[] = [];
        const { structuralVariantMapperStores } = this.props.store;

        for (const gene of this.props.store.hugoGeneSymbols!) {
            const structuralVariantMapperStore =
                structuralVariantMapperStores.result[gene];

            if (structuralVariantMapperStore) {
                tabs.push(
                    <MSKTab key={gene} id={gene} linkText={gene}>
                        <div className="alert alert-info">
                            This is an experimental feature. The structural
                            variant gene and event info annotations might not
                            always be correct. If you are interested in
                            improving SV annotation and visualization together,
                            please reach out on cbioportal@googlegroups.com
                        </div>
                        <ResultsViewStructuralVariantMapper
                            store={structuralVariantMapperStore}
                        />
                    </MSKTab>
                );
            }
        }

        return tabs;
    }

    @action
    public setSelectedGeneSymbol(hugoGeneSymbol: string) {
        this.props.urlWrapper.updateURL({
            mutations_gene: hugoGeneSymbol,
        });
    }

    @autobind
    protected handleTabChange(id: string) {
        this.setSelectedGeneSymbol(id);
    }

    @computed get selectedGeneSymbol() {
        return this.props.urlWrapper.query.mutations_gene &&
            this.props.store.hugoGeneSymbols.includes(
                this.props.urlWrapper.query.mutations_gene
            )
            ? this.props.urlWrapper.query.mutations_gene
            : this.props.store.hugoGeneSymbols[0];
    }

    render() {
        const activeTabId = this.selectedGeneSymbol;

        return (
            <div data-test="structuralVariantsTabDiv">
                {this.props.store.structuralVariantMapperStores.isPending && (
                    <LoadingIndicator
                        center={true}
                        isLoading={true}
                        size={'big'}
                    />
                )}
                {this.props.store.structuralVariantMapperStores.isComplete && (
                    <MSKTabs
                        id="structuralVariantsPageTabs"
                        activeTabId={activeTabId}
                        onTabClick={(id: string) => this.handleTabChange(id)}
                        className="pillTabs resultsPageStructuralVariantsGeneTabs"
                        arrowStyle={{ 'line-height': 0.8 }}
                        tabButtonStyle="pills"
                        unmountOnHide={true}
                    >
                        {this.generateTabs}
                    </MSKTabs>
                )}
            </div>
        );
    }
}
