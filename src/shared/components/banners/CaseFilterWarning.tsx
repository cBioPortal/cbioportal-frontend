import * as React from 'react';
import { observer } from 'mobx-react';
import { ResultsViewPageStore } from '../../../pages/resultsView/ResultsViewPageStore';
import { MakeMobxView } from '../MobxView';
import { pluralize } from 'cbioportal-frontend-commons';

export interface ICaseFilterWarningProps {
    store: ResultsViewPageStore;
    isPatientMode?: boolean;
    isUnaffected?: boolean;
}

@observer
export default class CaseFilterWarning extends React.Component<
    ICaseFilterWarningProps,
    {}
> {
    readonly sampleWarning = MakeMobxView({
        await: () => [
            this.props.store.samples,
            this.props.store.filteredSamples,
            this.props.store.patients,
            this.props.store.filteredPatients,
        ],
        render: () => {
            let nFiltered: number;
            if (this.props.isPatientMode) {
                const nPatients = this.props.store.patients.result!.length;
                const nFilteredPatients = this.props.store.filteredPatients
                    .result!.length;
                nFiltered = nPatients - nFilteredPatients;
            } else {
                const nSamples = this.props.store.samples.result!.length;
                const nFilteredSamples = this.props.store.filteredSamples
                    .result!.length;
                nFiltered = nSamples - nFilteredSamples;
            }
            if (nFiltered === 0) {
                return null;
            }

            const is = nFiltered === 1 ? 'is' : 'are';
            const it = nFiltered === 1 ? 'it' : 'they';
            if (this.props.isUnaffected) {
                return (
                    <div className="alert alert-unaffected">
                        <i
                            className="fa fa-md fa-info-circle"
                            style={{
                                verticalAlign: 'middle !important',
                                marginRight: 6,
                                marginBottom: 1,
                            }}
                        />
                        {`${nFiltered} ${pluralize(
                            this.props.isPatientMode ? 'patient' : 'sample',
                            nFiltered
                        )}`}
                        {` that are not profiled in all selected genomic profiles`}
                        {` ${is} included in analysis.`}
                    </div>
                );
            } else {
                return (
                    <div className="alert alert-info">
                        <img
                            src={require('../../../rootImages/funnel.svg')}
                            style={{
                                marginRight: 6,
                                width: 15,
                                marginTop: -2,
                            }}
                        />
                        {`${nFiltered} ${pluralize(
                            this.props.isPatientMode ? 'patient' : 'sample',
                            nFiltered
                        )}`}
                        {` ${is} excluded from analysis since ${it} ${is} not profiled`}
                        {` for all genes in all queried profiles.`}
                    </div>
                );
            }
        },
    });

    render() {
        return this.sampleWarning.component;
    }
}
