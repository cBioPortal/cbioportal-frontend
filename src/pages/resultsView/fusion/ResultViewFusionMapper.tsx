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
import { ExonsChartStore } from '../../../shared/components/exonsCharts/ExonsChartStore';
import { CancerStudy, MolecularProfile } from '../../../shared/api/generated/CBioPortalAPI';
import { ResultViewFusionMapperStore } from './ResultViewFusionMapperStore';
import FusionPieChart from '../../../shared/components/fusionCharts/FusionPieChart';
import FusionPieChartLegend from '../../../shared/components/fusionCharts/FusionPieChartLegend';

export interface IFusionMapperProps {
    store: ResultViewFusionMapperStore;
}

@observer
export default class ResultViewFusionMapper extends React.Component<IFusionMapperProps, {}> {

    private renderComponents(studyResult: { [studyId: string]: CancerStudy },
                             molecularProfile: { [molecularProfileId: string]: MolecularProfile }) {
        const exonChartStore = new ExonsChartStore(
            this.props.store.gene,
            this.props.store.dataStore,
            this.props.store.processedEnsembleTranscripts,
            studyResult,
            this.props.store.processedPfamDomains,
            this.props.store.ensemblTranscripts.isPending
        );
        const store = this.props.store.dataStore;
        const occurence = this.props.store.fusionOccurrence;

        return (
            <div>
                <div style={{display: 'flex', flexWrap: 'wrap'}}>
                    <ExonsChart store={exonChartStore}/>
                    <FusionPieChart dataStore={store} fusionCounts={occurence}/>
                    <FusionPieChartLegend fusionCounts={occurence}/>
                </div>
                <hr style={{marginTop: 20}}/>
                <ResultsViewFusionTable
                    dataStore={store}
                    studyIdToStudy={studyResult}
                    molecularProfileIdToMolecularProfile={molecularProfile}
                    fusionMolecularProfile={this.props.store.fusionMolecularProfile}
                />
            </div>);
    }

    /**
     * Render fusion table but display loading indicator when fusion data is still pending
     * @returns {any}
     */
    public render() {
        const studyResult = this.props.store.studyIdToStudy.result;
        const molecularProfile = this.props.store.molecularProfileIdToMolecularProfile.result;
        return (
            <div>
                {studyResult && molecularProfile ? this.renderComponents(studyResult, molecularProfile) : ''}
            </div>
        )
    }
}
