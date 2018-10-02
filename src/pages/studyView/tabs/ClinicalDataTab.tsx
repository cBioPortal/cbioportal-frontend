import * as React from "react";
import {Column, default as LazyMobXTable} from "shared/components/lazyMobXTable/LazyMobXTable";
import {observer} from "mobx-react";
import * as _ from 'lodash';
import {ClinicalAttribute} from "../../../shared/api/generated/CBioPortalAPI";
import {getPatientViewUrl, getSampleViewUrl} from "shared/api/urls";
import SelectedInfo from "../SelectedInfo/SelectedInfo";
import {getClinicalAttributeUniqueKey} from "../StudyViewUtils";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import { StudyViewPageStore } from "pages/studyView/StudyViewPageStore";
import { remoteData } from "shared/api/remoteData";

export interface IClinicalDataTabTable {
    store: StudyViewPageStore
}

class ClinicalDataTabTableComponent extends LazyMobXTable<{ [id: string]: string }> {
}

@observer
export class ClinicalDataTab extends React.Component<IClinicalDataTabTable, {}> {

    getDefaultColumnConfig(key: string) {
        return {
            name: '',
            render: (data: { [id: string]: string }) => <span>{data[key]}</span>,
            download: (data: { [id: string]: string }) => data[key] || '',
            sortBy: (data: { [id: string]: string }) => data[key],
            filter: (data: { [id: string]: string }, filterString: string, filterStringUpper: string) =>  (data[key] || '').toUpperCase().includes(filterStringUpper)
        };
    }

    readonly columns = remoteData({
        await: () => [this.props.store.clinicalAttributes],
        invoke: async () => {
            
            let defaultColumns: Column<{ [id: string]: string }>[] = [{
                ...this.getDefaultColumnConfig('patientId'),
                render: (data: { [id: string]: string }) => {
                    return <a href={getPatientViewUrl(data.studyId, data.patientId)} target='_blank'>{data.patientId}</a>
                },
                name: 'Patient ID'
            }, {
                ...this.getDefaultColumnConfig('sampleId'),
                render: (data: { [id: string]: string }) => {
                    return <a href={getSampleViewUrl(data.studyId, data.sampleId)} target='_blank'>{data.sampleId}</a>
                },
                name: 'Sample ID'
            }, {
                ...this.getDefaultColumnConfig('studyId'),
                name: 'Cancer Study'
            }];
            // Descent sort priority then ascent sort by display name
            return _.reduce(this.props.store.clinicalAttributes.result.sort( (a, b) => {
                let _a = Number(a.priority) || 0;
                let _b = Number(b.priority) || 0;
                let priorityDiff = _b - _a;
                if (priorityDiff === 0) {
                    return (a.displayName === undefined ? "" : a.displayName).localeCompare(b.displayName);
                }
                return priorityDiff;
            }), (acc: Column<{ [id: string]: string }>[], attr: ClinicalAttribute, index: number) => {
                acc.push({
                    ...this.getDefaultColumnConfig(getClinicalAttributeUniqueKey(attr)),
                    name: attr.displayName,
                    visible: index < 5
                });
                return acc;
            }, defaultColumns);
        },
        default: []
    });

    public render() {
        return (
            <div>
                <LoadingIndicator isLoading={this.props.store.selectedSamples.isPending &&
                    this.columns.isPending &&
                    this.props.store.getDataForClinicalDataTab.isPending}
                />
                {
                    this.props.store.selectedSamples.isComplete &&
                    <SelectedInfo selectedSamples={this.props.store.selectedSamples.result} />
                }
                {
                    this.props.store.getDataForClinicalDataTab.isComplete &&
                    this.columns.isComplete &&
                    <ClinicalDataTabTableComponent
                        initialItemsPerPage={10}
                        showCopyDownload={true}
                        showColumnVisibility={true}
                        data={this.props.store.getDataForClinicalDataTab.result || []}
                        columns={this.columns.result}
                    />
                }
            </div>
        );
    }
}

