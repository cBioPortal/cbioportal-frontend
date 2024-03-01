import Tooltip from 'rc-tooltip';
import {
    ArticleAbstract,
    IndicatorQueryTreatment,
    Trial,
} from 'oncokb-ts-api-client';
import * as React from 'react';
import ReactTable from 'react-table';

import {
    getTumorTypeName,
    getTumorTypeNameWithExclusionInfo,
} from '../util/OncoKbUtils';
import OncoKbHelper from './OncoKbHelper';
import { EvidenceReferenceContent } from './oncokbCard/EvidenceReferenceContent';

import mainStyles from './main.module.scss';
import './oncoKbTreatmentTable.scss';
import { OncoKbTrialTable } from './OncoKbTrialTable';

type OncoKbTreatmentTableProps = {
    variant: string;
    treatments: IndicatorQueryTreatment[];
};

export const OncoKbTreatmentTable: React.FunctionComponent<OncoKbTreatmentTableProps> = ({
    variant,
    treatments,
}: OncoKbTreatmentTableProps) => {
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

    const trialTableContent = (trials: Trial[]) => {
        return trials.length > 0 ? (
            () => (
                <div className={mainStyles['tooltip-refs']}>
                    <OncoKbTrialTable trials={trials} />
                </div>
            )
        ) : (
            <span />
        );
    };

    const columns = [
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
                    {props.original.drugs
                        .map(drug => drug.drugName)
                        .join(' + ')}
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
            minWidth: 100,
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
        {
            id: 'clinicalTrials',
            Header: (
                <span>
                    # of Clinical
                    <br />
                    Trials
                </span>
            ),
            sortable: false,
            minWidth: 50,
            accessor: 'clinicalTrials',
            Cell: (props: { original: IndicatorQueryTreatment }) =>
                props.original.trials && props.original.trials.length > 0 ? (
                    <div className={mainStyles['tooltip-refs']}>
                        <Tooltip
                            overlay={trialTableContent(props.original.trials)}
                            placement="right"
                            trigger={['hover', 'focus']}
                            destroyTooltipOnHide={true}
                        >
                            <span>
                                {props.original.trials
                                    ? props.original.trials.length
                                    : '0'}
                            </span>
                        </Tooltip>
                    </div>
                ) : (
                    <div
                        style={{ whiteSpace: 'normal', lineHeight: '1rem' }}
                    ></div>
                ),
        },
    ];

    return (
        <div className="oncokb-treatment-table">
            <ReactTable
                data={treatments}
                columns={columns}
                showPagination={false}
                pageSize={treatments.length}
                className="-striped -highlight"
            />
        </div>
    );
};
