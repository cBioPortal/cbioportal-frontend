import _ from 'lodash';
import * as React from 'react';

import { observer } from 'mobx-react';
import { action, observable } from 'mobx';
import { SignalAnnotation } from 'genome-nexus-ts-api-client';
import {
    ISignalTumorTypeDecomposition,
    generateTumorTypeDecomposition,
} from 'cbioportal-utils';
import autobind from 'autobind-decorator';
import { Pathogenicity } from '../../util/Constants';
import MutationTumorTypeFrequencyTable from './MutationTumorTypeFrequencyTable';

interface IFrequencyTableProps {
    signalAnnotation?: SignalAnnotation;
}

@observer
class FrequencyTable extends React.Component<IFrequencyTableProps> {
    // only show tab when two signal annotations are returned
    @observable selectedTab: string | undefined =
        this.props.signalAnnotation &&
        this.props.signalAnnotation.annotation.length > 1
            ? Pathogenicity.GERMLINE
            : undefined;

    private frequencyTable() {
        if (
            this.props.signalAnnotation &&
            this.props.signalAnnotation.annotation.length > 0
        ) {
            if (this.props.signalAnnotation.annotation.length > 1) {
                let tabs: JSX.Element[] = [];
                let tabContents: JSX.Element[] = [];
                _.forEach(
                    this.props.signalAnnotation.annotation,
                    annotation => {
                        const tumorTypeDecomposition: ISignalTumorTypeDecomposition[] = generateTumorTypeDecomposition(
                            annotation.mutationStatus,
                            annotation.countsByTumorType,
                            annotation.biallelicCountsByTumorType,
                            annotation.qcPassCountsByTumorType,
                            annotation.statsByTumorType
                        );
                        const mutationStatus = annotation.mutationStatus;
                        // show germline table first
                        if (mutationStatus === Pathogenicity.SOMATIC) {
                            tabs.push(this.generateTab(mutationStatus));
                        }
                        if (mutationStatus === Pathogenicity.GERMLINE) {
                            tabs.unshift(this.generateTab(mutationStatus));
                        }
                        tabContents.push(
                            this.generateTabContent(
                                mutationStatus,
                                tumorTypeDecomposition
                            )
                        );
                    }
                );
                return (
                    <div>
                        <nav>
                            <div
                                className="nav nav-tabs"
                                id="nav-tab"
                                role="tablist"
                            >
                                {tabs}
                            </div>
                        </nav>
                        <div className="tab-content" id="nav-tabContent">
                            {tabContents}
                        </div>
                    </div>
                );
            } else {
                const annotation = this.props.signalAnnotation.annotation[0];
                const tumorTypeDecomposition: ISignalTumorTypeDecomposition[] = generateTumorTypeDecomposition(
                    annotation.mutationStatus,
                    annotation.countsByTumorType,
                    annotation.biallelicCountsByTumorType,
                    annotation.qcPassCountsByTumorType,
                    annotation.statsByTumorType
                );
                return (
                    <MutationTumorTypeFrequencyTable
                        data={tumorTypeDecomposition}
                    />
                );
            }
        } else {
            return null;
        }
    }

    private generateTab(mutationStatus: string) {
        return (
            <a
                className={`nav-link${
                    this.selectedTab === mutationStatus ? ' active' : ''
                }`}
                key={`tab-${mutationStatus}`}
                data-toggle="tab"
                role="tab"
                id={`nav-${mutationStatus}-tab`}
                onClick={() => this.onTabSelect(mutationStatus)}
            >
                {_.upperFirst(mutationStatus)}
            </a>
        );
    }

    private generateTabContent(
        mutationStatus: string,
        tumorTypeDecomposition: ISignalTumorTypeDecomposition[]
    ) {
        return (
            <div
                className={`tab-pane fade${
                    this.selectedTab === mutationStatus ? ' show active' : ''
                }`}
                key={`tab-content-${mutationStatus}`}
                id={`nav-${mutationStatus}`}
                role="tabpanel"
                aria-labelledby={`#nav-${mutationStatus}`}
            >
                <MutationTumorTypeFrequencyTable
                    data={tumorTypeDecomposition}
                />
            </div>
        );
    }

    @action.bound
    private onTabSelect(tabId: string) {
        this.selectedTab = tabId;
    }

    public render() {
        return this.frequencyTable();
    }
}

export default FrequencyTable;
