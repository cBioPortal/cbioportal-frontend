import _ from 'lodash';
import Tooltip from 'rc-tooltip';
import { ArticleAbstract, IndicatorQueryTreatment } from 'oncokb-ts-api-client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import ReactTable from 'react-table';

import {
    getTumorTypeName,
    getTumorTypeNameWithExclusionInfo,
} from '../util/OncoKbUtils';
import OncoKbHelper from './OncoKbHelper';
import { EvidenceReferenceContent } from './oncokbCard/EvidenceReferenceContent';

import mainStyles from './main.module.scss';
import './oncoKbTreatmentTable.scss';
import request from 'superagent';
import { observable, observe } from 'mobx';

let cancerdrugsUrl = localStorage.getItem('cancerdrugsUrl') || '';
let cancerdrugsJsonUrl = localStorage.getItem('cancerdrugsJsonUrl') || '';

type OncoKbTreatmentTableProps = {
    variant: string;
    treatments: IndicatorQueryTreatment[];
};

type EmaDrugInfo = {
    infoAvailable: boolean;
    activeSubstance: string;
    conditionIndication: string;
    authorisationDate: string;
    authorisationHolder: string;
    medicineName: string;
    url: string;
};

type OncoKbTreatmentTableState = {
    isLoading: boolean;
    drugInfos: DrugInfo[];
};

interface DrugInfo {
    name: string;
    drugInfo: EmaDrugInfo[];
}

export const OncoKbTreatmentTable: React.FunctionComponent<OncoKbTreatmentTableProps> = ({
    variant,
    treatments,
}: OncoKbTreatmentTableProps) => {
    const [state, setState] = React.useState<OncoKbTreatmentTableState>({
        isLoading: true,
        drugInfos: [],
    });

    const levelTooltipContent = (level: string) => {
        return (
            <div style={{ maxWidth: '200px' }}>
                {OncoKbHelper.LEVEL_DESC[level]}
            </div>
        );
    };

    const treatmentTooltipContent = (
        abstracts: ArticleAbstract[],
        pmids: number[],
        description?: string
    ) => {
        return abstracts.length > 0 || pmids.length > 0 ? (
            () => (
                <div className={mainStyles['tooltip-refs']}>
                    <EvidenceReferenceContent
                        description={description}
                        citations={{
                            pmids: pmids.map(pmid => pmid.toString()),
                            abstracts: abstracts,
                        }}
                        noInfoDisclaimer={
                            'Mutation effect information is not available.'
                        }
                    />
                </div>
            )
        ) : (
            <span />
        );
    };

    useEffect(() => {
        let promiseDrugInfos = [] as DrugInfo[];

        async function promiseDrugInfo(drug: string): Promise<DrugInfo> {
            try {
                let getResponse = await request.get(
                    cancerdrugsJsonUrl + drug.replace(' ', '_') + '.json'
                );

                if (
                    !getResponse.clientError &&
                    !getResponse.serverError &&
                    getResponse.status == 200
                ) {
                    const response = JSON.parse(getResponse.text);
                    const emaEpar = response.emaEpar;
                    if (emaEpar.length === 0) {
                        const emaInfo = {
                            infoAvailable: false,
                        } as EmaDrugInfo;
                        promiseDrugInfos = [
                            ...promiseDrugInfos,
                            {
                                name: drug,
                                drugInfo: [emaInfo],
                            },
                        ];
                    } else {
                        const emaInfos = new Array<EmaDrugInfo>();
                        emaEpar.map((emaEparEntry: any) => {
                            const emaInfo = {
                                infoAvailable: true,
                                activeSubstance: emaEparEntry.activeSubstance,
                                conditionIndication:
                                    emaEparEntry.conditionIndication,
                                authorisationDate:
                                    emaEparEntry.marketingAuthorisationDate,
                                authorisationHolder:
                                    emaEparEntry.marketingAuthorisationHolder,
                                medicineName: emaEparEntry.medicineName,
                                url: emaEparEntry.url,
                            } as EmaDrugInfo;
                            emaInfos.push(emaInfo);
                        });
                        promiseDrugInfos = [
                            ...promiseDrugInfos,
                            {
                                name: drug,
                                drugInfo: emaInfos,
                            },
                        ];
                    }
                } else {
                    promiseDrugInfos = [
                        ...promiseDrugInfos,
                        {
                            name: drug,
                            drugInfo: [],
                        },
                    ];
                }
            } catch (error) {
                promiseDrugInfos = [
                    ...promiseDrugInfos,
                    {
                        name: drug,
                        drugInfo: [],
                    },
                ];
            }

            return new Promise<DrugInfo>((resolve, reject) =>
                resolve({
                    name: drug,
                    drugInfo:
                        promiseDrugInfos.find(pdi => pdi.name == drug)
                            ?.drugInfo || [],
                })
            );
        }

        let promiseArray = [] as Array<Promise<DrugInfo>>;
        treatments.forEach(treatment =>
            treatment.drugs.forEach(drug =>
                promiseArray.push(promiseDrugInfo(drug.drugName))
            )
        );

        Promise.all(promiseArray).finally(() => {
            setState({
                isLoading: false,
                drugInfos: promiseDrugInfos.filter(
                    (tag, index, array) =>
                        array.findIndex(t => t.name == tag.name) == index
                ),
            });
        });
    }, []);

    const emaTooltipStyle = (drugName: string) => {
        const drugInfo = state.drugInfos.find(drug => drug.name == drugName)
            ?.drugInfo;
        if (!drugInfo) {
            return 'fa fa-spinner fa-spin fa-lg';
        } else if (drugInfo.length < 1) {
            return 'fa fa-eur text-muted fa-lg';
        } else if (!drugInfo[0].infoAvailable) {
            return 'fa fa-eur text-danger fa-lg';
        } else {
            return 'fa fa-eur text-primary fa-lg';
        }
    };

    const emaTooltipContent = (drugName: string) => {
        const drugInfo = state.drugInfos.find(drug => drug.name == drugName)
            ?.drugInfo;
        if (!drugInfo) {
            return (
                <div style={{ maxWidth: '400px' }}>
                    Getting EMA information...
                </div>
            );
        } else if (drugInfo.length < 1) {
            return (
                <div style={{ maxWidth: '400px' }}>
                    No entry found in cancerdrugs. <br />
                    <a href={cancerdrugsUrl} target={'_blank'}>
                        Search on cancerdrugs
                    </a>
                </div>
            );
        } else if (!drugInfo[0].infoAvailable) {
            return (
                <div style={{ maxWidth: '400px' }}>
                    {drugName} is <b>not</b> authorized in the EU. <br />
                    <a
                        href={cancerdrugsUrl + '/drugs/' + drugName}
                        target={'_blank'}
                    >
                        More info on cancerdrugs
                    </a>
                </div>
            );
        } else {
            return (
                <div style={{ maxWidth: '400px' }}>
                    {drugInfo.map((drugInfoEntry: EmaDrugInfo) =>
                        emaTooltipEntry(drugName, drugInfoEntry)
                    )}
                    <a
                        href={cancerdrugsUrl + '/drugs/' + drugName}
                        target={'_blank'}
                    >
                        More info on cancerdrugs
                    </a>
                </div>
            );
        }
    };

    const emaTooltipEntry = (drugName: string, drugInfo: EmaDrugInfo) => {
        return (
            <span>
                {drugName} is authorized in the EU under the name of{' '}
                {drugInfo.medicineName} since{' '}
                {drugInfo.authorisationDate.split(' ')[0]} by{' '}
                {drugInfo.authorisationHolder} (
                <a href={drugInfo.url} target={'_blank'}>
                    more info
                </a>
                ). <br />
                Authorized indication: {drugInfo.conditionIndication} <br />
            </span>
        );
    };

    function getColumns() {
        return [
            OncoKbHelper.getDefaultColumnDefinition('level'),
            {
                ...OncoKbHelper.getDefaultColumnDefinition('alterations'),
                Cell: (props: { value: string[] }) => {
                    return OncoKbHelper.getAlterationsColumnCell(
                        props.value,
                        variant
                    );
                },
            },
            {
                id: 'treatment',
                Header: <span>Drug(s)</span>,
                accessor: 'drugs',
                Cell: (props: { original: IndicatorQueryTreatment }) => (
                    <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                        {/* {props.original.drugs
                            .map(drug => drug.drugName)
                            .join(' + ')} */}
                        {props.original.drugs.map(drug => (
                            <div>
                                <span style={{ marginRight: '5px' }}>
                                    {drug.drugName}
                                </span>
                                <Tooltip
                                    placement="left"
                                    trigger={['hover', 'focus']}
                                    overlay={
                                        <div>
                                            {emaTooltipContent(drug.drugName)}
                                        </div>
                                    }
                                    destroyTooltipOnHide={true}
                                >
                                    <i
                                        className={emaTooltipStyle(
                                            drug.drugName
                                        )}
                                    ></i>
                                </Tooltip>
                            </div>
                        ))}
                    </div>
                ),
            },
            {
                id: 'cancerType',
                Header: (
                    <span>
                        Level-associated
                        <br />
                        cancer type(s)
                    </span>
                ),
                accessor: 'levelAssociatedCancerType',
                minWidth: 120,
                Cell: (props: { original: IndicatorQueryTreatment }) => (
                    <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                        {getTumorTypeNameWithExclusionInfo(
                            props.original.levelAssociatedCancerType,
                            props.original.levelExcludedCancerTypes
                        )}
                    </div>
                ),
            },
            {
                id: 'referenceList',
                Header: <span />,
                sortable: false,
                maxWidth: 25,
                Cell: (props: { original: IndicatorQueryTreatment }) =>
                    (props.original.abstracts.length > 0 ||
                        props.original.pmids.length > 0) && (
                        <Tooltip
                            overlay={treatmentTooltipContent(
                                props.original.abstracts,
                                props.original.pmids.map(pmid => Number(pmid)),
                                props.original.description
                            )}
                            placement="right"
                            trigger={['hover', 'focus']}
                            destroyTooltipOnHide={true}
                        >
                            <i className="fa fa-book" />
                        </Tooltip>
                    ),
            },
        ];
    }

    return (
        <div className="oncokb-treatment-table">
            <ReactTable
                data={treatments}
                columns={getColumns()}
                showPagination={false}
                pageSize={treatments.length}
                className="-striped -highlight"
            />
        </div>
    );
};
