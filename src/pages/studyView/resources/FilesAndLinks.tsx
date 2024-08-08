import * as React from 'react';
import {
    Column,
    default as LazyMobXTable,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import { observer } from 'mobx-react';
import _, { forEach } from 'lodash';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import { Else, If, Then } from 'react-if';
import { WindowWidthBox } from '../../../shared/components/WindowWidthBox/WindowWidthBox';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    getSampleViewUrlWithPathname,
    getPatientViewUrlWithPathname,
} from 'shared/api/urls';
import { getAllClinicalDataByStudyViewFilter } from '../StudyViewUtils';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { isUrl, remoteData } from 'cbioportal-frontend-commons';
import { makeObservable, observable } from 'mobx';
import { ResourceData, StudyViewFilter } from 'cbioportal-ts-api-client';

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

    const sortedData = _.orderBy(data, 'resourcesPerPatient', 'desc');
    return {
        totalItems: sortedData.length,
        data: _.values(sortedData),
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

    @observable searchTerm: string | undefined = undefined;

    readonly getData = remoteData({
        await: () => [
            this.props.store.selectedSamples,
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
                this.props.store.sampleResourceData.result!,
                this.searchTerm,
                'patientId',
                'asc',
                RECORD_LIMIT
            );

            return Promise.resolve(sampleData);
        },
    });

    readonly columns = remoteData({
        invoke: async () => {
            let defaultColumns: Column<{ [id: string]: any }>[] = [
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
                        'typeOfResource',
                        'Type Of Resource'
                    ),
                    render: (data: { [id: string]: string }) => {
                        return (
                            <div>
                                <a href={data.url} target="_blank">
                                    <i
                                        className={`fa fa-external-link fa-sm`}
                                        style={{
                                            marginRight: 5,
                                            color: 'black',
                                            fontSize: 10,
                                        }}
                                    />
                                    {data.typeOfResource}
                                </a>
                            </div>
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

                {
                    ...this.getDefaultColumnConfig(
                        'resourcesPerPatient',
                        'Number of Resource Per Patient',
                        true
                    ),
                    render: (data: { [id: string]: number }) => {
                        return <div>{data.resourcesPerPatient}</div>;
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
                <WindowWidthBox offset={60}>
                    <If condition={this.getData.isPending}>
                        <Then>
                            <LoadingIndicator
                                isLoading={true}
                                size={'big'}
                                center={true}
                            />
                        </Then>
                        <Else>
                            <FilesLinksTableComponent
                                initialItemsPerPage={20}
                                headerComponent={
                                    <div className={'positionAbsolute'}>
                                        <strong>
                                            {this.getData.result?.totalItems}{' '}
                                            resources
                                        </strong>
                                    </div>
                                }
                                data={this.getData.result?.data || []}
                                columns={this.columns.result}
                                showColumnVisibility={false}
                                showCountHeader={false}
                                showFilterClearButton={false}
                                showCopyDownload={false}
                                initialSortColumn={'resourcesPerPatient'}
                                initialSortDirection={'desc'}
                            />
                        </Else>
                    </If>
                </WindowWidthBox>
            </span>
        );
    }
}
