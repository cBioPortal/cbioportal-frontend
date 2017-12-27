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
import ResultsViewFusionTable from './ResultsViewFusionTable';
import { observer } from 'mobx-react';
import ExonsChart from '../../../shared/components/exonsCharts/ExonsChart';
import { ResultViewFusionMapperStore } from './ResultViewFusionMapperStore';
import FusionPieChart from '../../../shared/components/fusionCharts/FusionPieChart';
import FusionPieChartLegend from '../../../shared/components/fusionCharts/FusionPieChartLegend';
import { MakeMobxView } from '../../../shared/components/MobxView';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../../shared/components/ErrorMessage';

export interface IFusionMapperProps {
    store: ResultViewFusionMapperStore;
}

@observer
export default class ResultViewFusionMapper extends React.Component<
    IFusionMapperProps,
    {}
> {
    private renderComponents() {
        const {
            dataStore,
            fusionCounts,
            exonsChartStore,
            fusionMolecularProfile,
            studyIdToStudy,
            molecularProfileIdToMolecularProfile,
        } = this.props.store;

        const studyMap = new Map(Object.entries(studyIdToStudy.result || {}));
        const molecularProfileMap = new Map(
            Object.entries(molecularProfileIdToMolecularProfile.result || {})
        );

        return (
            <React.Fragment>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    <ExonsChart store={this.props.store.exonsChartStore} />
                    <FusionPieChart
                        store={dataStore}
                        fusionCounts={fusionCounts}
                    />
                    <FusionPieChartLegend fusionCounts={fusionCounts} />
                </div>
                <hr style={{ marginTop: 20 }} />
                <ResultsViewFusionTable
                    dataStore={dataStore}
                    studyIdToStudy={studyMap}
                    molecularProfileIdToMolecularProfile={molecularProfileMap}
                    fusionMolecularProfile={fusionMolecularProfile}
                />
            </React.Fragment>
        );
    }

    readonly resultFusionUI = MakeMobxView({
        await: () => [
            this.props.store.studyIdToStudy,
            this.props.store.molecularProfileIdToMolecularProfile,
        ],
        render: () => {
            return this.renderComponents();
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return this.resultFusionUI.component;
    }
}
