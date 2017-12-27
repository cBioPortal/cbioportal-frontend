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

import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import { IFusionMapperProps } from './IFusionMapperProps';
import * as React from 'react';
import ResultsViewFusionTable from './ResultsViewFusionTable';
import { observer } from 'mobx-react';

@observer
export default class FusionMapper extends React.Component<IFusionMapperProps, {}> {

    private getFusionMolecularProfile(): any {
        const molecularProfiles = this.props.store.molecularProfileIdToMolecularProfile.result;
        let fusionMolecularProfile = null;
        if (molecularProfiles) {
            let _keys = Object.keys(molecularProfiles);
            _keys.forEach( profileKey => {
                if (molecularProfiles[profileKey].datatype === 'SV') {
                    fusionMolecularProfile =  molecularProfiles[profileKey];
                }
            });
        }
        return fusionMolecularProfile;
    }

    /**
     * Render fusion table but display loading indicator when fusion data is still pending
     * @returns {any}
     */
    public render() {

        let renderComp = this.props.store.fusionData.isPending ?
            <LoadingIndicator isLoading={this.props.store.fusionData.isPending} /> :
            <ResultsViewFusionTable
                dataStore={this.props.store.dataStore}
                studyIdToStudy={this.props.store.studyIdToStudy.result}
                molecularProfileIdToMolecularProfile={this.props.store.molecularProfileIdToMolecularProfile.result}
                fusionMolecularProfile={this.getFusionMolecularProfile()}
            />;
        return (
            <div>
                {/*TODO: Plot for fusion data*/}
                <hr style={{ marginTop:20 }} />
                {renderComp}
            </div>
        )
    }

}
