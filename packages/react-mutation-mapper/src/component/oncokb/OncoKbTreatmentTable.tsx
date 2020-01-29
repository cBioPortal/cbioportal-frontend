import { DefaultTooltip, ICache, LEVELS } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import * as React from 'react';
import ReactTable from 'react-table';

import { ArticleAbstract, OncoKbTreatment } from '../../model/OncoKb';
import { levelIconClassNames, mergeAlterations } from '../../util/OncoKbUtils';
import {
    defaultArraySortMethod,
    defaultSortMethod,
} from '../../util/ReactTableUtils';
import OncoKbHelper from './OncoKbHelper';
import ReferenceList from './ReferenceList';
import SummaryWithRefs from './SummaryWithRefs';

import mainStyles from './main.module.scss';
import './oncoKbTreatmentTable.scss';

type OncoKbTreatmentTableProps = {
    treatments: OncoKbTreatment[];
    pmidData: ICache<any>;
};

@observer
export default class OncoKbTreatmentTable extends React.Component<
    OncoKbTreatmentTableProps
> {
    levelTooltipContent = (level: string) => {
        return (
            <div style={{ maxWidth: '200px' }}>
                {OncoKbHelper.LEVEL_DESC[level]}
            </div>
        );
    };

    treatmentTooltipContent = (
        abstracts: ArticleAbstract[],
        pmids: number[],
        pmidData: ICache<any>,
        description?: string
    ) => {
        return abstracts.length > 0 || pmids.length > 0 ? (
            () => (
                <div className={mainStyles['tooltip-refs']}>
                    {description !== undefined && description.length > 0 ? (
                        <SummaryWithRefs
                            content={description}
                            type={'tooltip'}
                            pmidData={this.props.pmidData}
                        />
                    ) : (
                        <ReferenceList
                            pmids={pmids}
                            pmidData={pmidData}
                            abstracts={abstracts}
                        />
                    )}
                </div>
            )
        ) : (
            <span />
        );
    };

    readonly columns = [
        {
            id: 'level',
            Header: <span>Level</span>,
            accessor: 'level',
            maxWidth: 45,
            sortMethod: (a: string, b: string) =>
                defaultSortMethod(LEVELS.all.indexOf(a), LEVELS.all.indexOf(b)),
            Cell: (props: { value: string }) => (
                <DefaultTooltip
                    overlay={this.levelTooltipContent(props.value)}
                    placement="left"
                    trigger={['hover', 'focus']}
                    destroyTooltipOnHide={true}
                >
                    <i
                        className={levelIconClassNames(props.value)}
                        style={{ margin: 'auto' }}
                    />
                </DefaultTooltip>
            ),
        },
        {
            id: 'variant',
            Header: <span>Alteration(s)</span>,
            accessor: 'variant',
            minWidth: 80,
            sortMethod: (a: string[], b: string[]) =>
                defaultArraySortMethod(a, b),
            Cell: (props: { value: string[] }) => (
                <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                    {mergeAlterations(props.value)}
                </div>
            ),
        },
        {
            id: 'treatment',
            Header: <span>Drug(s)</span>,
            accessor: 'treatment',
            Cell: (props: { original: OncoKbTreatment }) => (
                <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                    {props.original.treatment}
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
            accessor: 'cancerType',
            minWidth: 120,
            Cell: (props: { original: OncoKbTreatment }) => (
                <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                    {props.original.cancerType}
                </div>
            ),
        },
        {
            id: 'referenceList',
            Header: <span />,
            sortable: false,
            maxWidth: 25,
            Cell: (props: { original: OncoKbTreatment }) =>
                (props.original.abstracts.length > 0 ||
                    props.original.pmids.length > 0) && (
                    <DefaultTooltip
                        overlay={this.treatmentTooltipContent(
                            props.original.abstracts,
                            props.original.pmids,
                            this.props.pmidData,
                            props.original.description
                        )}
                        placement="right"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <i className="fa fa-book" />
                    </DefaultTooltip>
                ),
        },
    ];

    public render() {
        return (
            <div className="oncokb-treatment-table">
                <ReactTable
                    data={this.props.treatments}
                    columns={this.columns}
                    defaultSorted={[
                        {
                            id: 'level',
                            desc: true,
                        },
                    ]}
                    showPagination={false}
                    pageSize={this.props.treatments.length}
                    className="-striped -highlight"
                />
            </div>
        );
    }
}
