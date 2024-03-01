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
import { transformFile } from '@babel/core';
import { Link } from 'react-router-dom';

type OncoKbTrialTableProps = {
    trials: Trial[];
};

export const OncoKbTrialTable: React.FunctionComponent<OncoKbTrialTableProps> = ({
    trials,
}: OncoKbTrialTableProps) => {
    const columns = [
        {
            id: 'trialInfo',
            Header: <span>Trial</span>,
            Cell: (props: { original: Trial }) =>
                props.original.nctId ? (
                    <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                        <a
                            target="_blank"
                            href={`https://clinicaltrials.gov/ct2/results?term=${props.original.nctId}`}
                        >
                            {props.original.nctId}
                        </a>
                        <br />
                        {props.original.phase}
                        <br />
                        {props.original.currentTrialStatus}
                    </div>
                ) : (
                    <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                        NCT ID unknown
                    </div>
                ),
        },
        {
            id: 'title',
            Header: <span>Title</span>,
            minWidth: 250,
            Cell: (props: { original: Trial }) =>
                props.original.phase ? (
                    <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                        {props.original.briefTitle}
                    </div>
                ) : (
                    <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                        Title unknown
                    </div>
                ),
        },
    ];

    return (
        <div className="oncokb-treatment-table">
            <ReactTable
                data={trials}
                columns={columns}
                showPagination={false}
                pageSize={trials.length}
                className="-striped -highlight"
            />
        </div>
    );
};
