import * as React from 'react';
import {
    Column,
    default as LazyMobXTable,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import { observer } from 'mobx-react';
import _, { forEach } from 'lodash';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import {
    getPatientViewUrl,
    getSampleViewUrl,
    getSampleViewUrlWithPathname,
    getPatientViewUrlWithPathname,
} from 'shared/api/urls';
import { getAllClinicalDataByStudyViewFilter } from '../StudyViewUtils';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { isUrl, remoteData } from 'cbioportal-frontend-commons';
import { makeObservable, observable } from 'mobx';
import {
    ResourceData,
    Sample,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import { PatientViewPageStore } from 'pages/patientView/clinicalInformation/PatientViewPageStore';

export interface IFilesLinksTable {
    store: StudyViewPageStore;
}

class FilesLinksTableComponent extends LazyMobXTable<{
    [id: string]: string;
}> {}

const RECORD_LIMIT = 500;

async function fetchResourceDataOfPatient(patientIds: Map<string, string>) {
    const ret: { [key: string]: ResourceData[] } = {};
    const promises = [];
    for (let [patientId, studyId] of patientIds) {
        promises.push(
            internalClient
                .getAllResourceDataOfPatientInStudyUsingGET({
                    studyId: studyId,
                    patientId: patientId,
                    projection: 'DETAILED',
                })
                .then(data => {
                    if (patientId in ret) {
                        ret[patientId].push(...data);
                    } else {
                        ret[patientId] = data;
                    }
                })
        );
    }

    return Promise.all(promises).then(() => ret);
}

async function fetchFilesLinksData(
    filters: StudyViewFilter,
    sampleSetByKey: { [sampleId: string]: Sample },
    sampleIdResourceData: { [sampleId: string]: ResourceData[] },
    searchTerm: string | undefined,
    sortAttributeId: string | undefined,
    sortDirection: 'asc' | 'desc' | undefined,
    recordLimit: number
) {
    let sampleClinicalDataResponse = await getAllClinicalDataByStudyViewFilter(
        filters,
        searchTerm,
        sortAttributeId,
        sortDirection,
        recordLimit,
        0
    );

    const patientIds = new Map<string, string>();

    forEach(sampleClinicalDataResponse.data, (data, uniqueSampleId) => {
        forEach(data, item => {
            patientIds.set(item.patientId, item.studyId);
        });
    });

    const resourcesPerPatient: { [key: string]: number } = {};
    const items: { [attributeId: string]: any } = [];

    const itemBuilder = (resourceData: { [key: string]: ResourceData[] }) => {
        forEach(resourceData, (data: ResourceData[]) => {
            forEach(data, (resource: ResourceData) => {
                items.push({
                    studyId: resource.studyId,
                    patientId: resource.patientId,
                    sampleId: resource.sampleId,
                    resourcesPerPatient: 0,
                    typeOfResource: resource?.resourceDefinition?.displayName,
                    description: resource?.resourceDefinition?.description,
                    url: resource?.url,
                });
            });

            if (data && data.length > 0) {
                if (!(data[0].patientId in resourcesPerPatient))
                    resourcesPerPatient[data[0].patientId] = 0;

                resourcesPerPatient[data[0].patientId] += data.length;
            }
        });
    };

    itemBuilder(sampleIdResourceData);
    const resourcesForPatients = await fetchResourceDataOfPatient(patientIds);
    itemBuilder(resourcesForPatients);

    const data = _.mapValues(items, item => {
        item.resourcesPerPatient = resourcesPerPatient[item.patientId];
        return item;
    });

    return {
        totalItems: items.length,
        data: _.values(data),
    };
}

@observer
export class FilesAndLinks extends React.Component<IFilesLinksTable, {}> {
    constructor(props: IFilesLinksTable) {
        super(props);
        makeObservable(this);
    }

    getDefaultColumnConfig(
        key: string,
        columnName: string,
        isNumber?: boolean
    ) {
        return {
            name: columnName || '',
            headerRender: (data: string) => (
                <span data-test={data}>{data}</span>
            ),
            render: (data: { [id: string]: string }) => {
                if (isUrl(data[key])) {
                    return (
                        <a href={data[key]} target="_blank">
                            {data[key]}
                        </a>
                    );
                }
                return <span data-test={data[key]}>{data[key]}</span>;
            },
            download: (data: { [id: string]: string }) => data[key] || '',
            sortBy: (data: { [id: string]: any }) => {
                if (data[key]) {
                    if (isNumber) {
                        return parseFloat(data[key]);
                    } else {
                        return data[key];
                    }
                }
                return null;
            },
            filter: (
                data: { [id: string]: string },
                filterString: string,
                filterStringUpper: string
            ) => (data[key] || '').toUpperCase().includes(filterStringUpper),
        };
    }

    @observable clinicalDataTabSearchTerm: string | undefined = undefined;

    readonly getData = remoteData({
        await: () => [
            this.props.store.selectedSamples,
            this.props.store.sampleSetByKey,
            this.props.store.resourceDefinitions,
            this.props.store.sampleResourceData,
        ],
        onError: () => {},
        invoke: async () => {
            if (this.props.store.selectedSamples.result.length === 0) {
                return Promise.resolve({ totalItems: 0, data: [] });
            }
            const sampleData = await fetchFilesLinksData(
                this.props.store.filters,
                this.props.store.sampleSetByKey.result!,
                this.props.store.sampleResourceData.result!,
                undefined,
                'patientId',
                'asc',
                RECORD_LIMIT
            );

            return Promise.resolve(sampleData);
        },
    });

    readonly columns = remoteData({
        invoke: async () => {
            let defaultColumns: Column<{ [id: string]: string }>[] = [
                {
                    ...this.getDefaultColumnConfig('patientId', 'Patient ID'),
                    render: (data: { [id: string]: string }) => {
                        return (
                            <a
                                href={getPatientViewUrlWithPathname(
                                    data.studyId,
                                    data.patientId,
                                    'patient/filesAndLinks'
                                )}
                                target="_blank"
                            >
                                {data.patientId}
                            </a>
                        );
                    },
                },
                {
                    ...this.getDefaultColumnConfig('sampleId', 'Sample ID'),
                    render: (data: { [id: string]: string }) => {
                        return (
                            <a
                                href={getSampleViewUrlWithPathname(
                                    data.studyId,
                                    data.sampleId,
                                    'patient/filesAndLinks'
                                )}
                                target="_blank"
                                //
                            >
                                {data.sampleId}
                            </a>
                        );
                    },
                },

                {
                    ...this.getDefaultColumnConfig(
                        'numberOfResourcePerPatient',
                        'Number of Resource Per Patient'
                    ),
                    render: (data: { [id: string]: string }) => {
                        return <div>{data.resourcesPerPatient}</div>;
                    },
                },

                {
                    ...this.getDefaultColumnConfig(
                        'typeOfResource',
                        'Type Of Resource'
                    ),
                    render: (data: { [id: string]: string }) => {
                        return (
                            <a
                                href={data.url}
                                target="_blank"
                                //
                            >
                                {data.typeOfResource}
                            </a>
                        );
                    },
                },

                {
                    ...this.getDefaultColumnConfig(
                        'description',
                        'Description'
                    ),
                    render: (data: { [id: string]: string }) => {
                        return <div>{data.description}</div>;
                    },
                },
            ];

            return defaultColumns;
        },
        default: [],
    });

    public render() {
        return (
            <span data-test="files-links-data-content">
                <FilesLinksTableComponent
                    initialItemsPerPage={20}
                    data={this.getData.result?.data || []}
                    columns={this.columns.result}
                    showColumnVisibility={false}
                    //showFilter={false}
                    showCountHeader={false}
                    showFilterClearButton={false}
                    showCopyDownload={false}
                />
            </span>
        );
    }
}
