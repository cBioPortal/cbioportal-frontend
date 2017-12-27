/**
 * Copyright (c) 2018 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
 * version 3, or (at your option) any later version.
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import * as React from 'react';
import { observer } from 'mobx-react';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { observable, computed } from 'mobx';
import { MSKTab, MSKTabs } from '../../../shared/components/MSKTabs/MSKTabs';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import ResultViewFusionMapper from './ResultViewFusionMapper';
import { MakeMobxView } from '../../../shared/components/MobxView';
import autobind from 'autobind-decorator';
import ErrorMessage from '../../../shared/components/ErrorMessage';

export interface IFusionPageProps {
    routing?: any;
    store: ResultsViewPageStore;
}

@autobind
@observer
export default class Fusions extends React.Component<IFusionPageProps, {}> {
    @observable _fusionGeneTab: string | undefined = undefined;
    @computed get fusionGeneTab() {
        return this._fusionGeneTab || this.props.store.hugoGeneSymbols[0];
    }

    set fusionGeneTab(t: string | undefined) {
        this._fusionGeneTab = t;
    }

    protected generateTabs(genes: string[]) {
        const tabs: JSX.Element[] = [];
        genes.forEach((gene: string) => {
            const fusionMapperStore = this.props.store.fusionMapperStores
                .result[gene];
            if (fusionMapperStore) {
                tabs.push(
                    <MSKTab key={gene} id={gene} linkText={gene}>
                        <ResultViewFusionMapper store={fusionMapperStore} />
                    </MSKTab>
                );
            }
        });

        return tabs;
    }

    @autobind
    protected handleTabChange(id: string) {
        // update the hash if routing exits
        if (this.props.routing) {
            this.props.routing.updateRoute({ fusionGeneTab: id });
        }
        // update the observable if no routing
        else {
            this.fusionGeneTab = id;
        }
    }

    readonly fusionUI = MakeMobxView({
        await: () => [this.props.store.fusionMapperStores],
        render: () => {
            // use routing if available, if not fall back to the observable variable
            const activeTabId = this.props.routing
                ? this.props.routing.location.query.fusionsGeneTab
                : this.fusionGeneTab;
            return (
                <MSKTabs
                    id="fusionsPageTabs"
                    activeTabId={activeTabId}
                    onTabClick={(id: string) => this.handleTabChange(id)}
                    className="pillTabs resultsPageMutationsGeneTabs"
                    enablePagination={true}
                    arrowStyle={{ 'line-height': 0.8 }}
                    tabButtonStyle="pills"
                    unmountOnHide={true}
                >
                    {this.generateTabs(this.props.store.hugoGeneSymbols!)}
                </MSKTabs>
            );
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    render() {
        return this.fusionUI.component;
    }
}
