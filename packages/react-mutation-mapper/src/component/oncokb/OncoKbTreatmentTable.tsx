import _ from 'lodash';
import { DefaultTooltip, ICache, LEVELS } from 'cbioportal-frontend-commons';
import { ArticleAbstract, IndicatorQueryTreatment } from 'oncokb-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';
import ReactTable from 'react-table';

import {
    getTumorTypeName,
    levelIconClassNames,
    mergeAlterations,
    normalizeLevel,
} from '../../util/OncoKbUtils';
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
    variant: string;
    treatments: IndicatorQueryTreatment[];
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
                defaultSortMethod(
                    LEVELS.all.indexOf(normalizeLevel(a) || ''),
                    LEVELS.all.indexOf(normalizeLevel(b) || '')
                ),
            Cell: (props: { value: string }) => {
                const normalizedLevel = normalizeLevel(props.value) || '';
                return (
                    <DefaultTooltip
                        overlay={this.levelTooltipContent(normalizedLevel)}
                        placement="left"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <i
                            className={levelIconClassNames(normalizedLevel)}
                            style={{ margin: 'auto' }}
                        />
                    </DefaultTooltip>
                );
            },
        },
        {
            id: 'alterations',
            Header: <span>Alteration(s)</span>,
            accessor: 'alterations',
            minWidth: 80,
            sortMethod: (a: string[], b: string[]) =>
                defaultArraySortMethod(a, b),
            Cell: (props: { value: string[] }) => {
                const mergedAlteration = mergeAlterations(props.value);
                let content = <span>{mergedAlteration}</span>;
                if (props.value.length > 5) {
                    const lowerCasedQueryVariant = this.props.variant.toLowerCase();
                    let matchedAlteration = _.find(
                        props.value,
                        alteration =>
                            alteration.toLocaleLowerCase() ===
                            lowerCasedQueryVariant
                    );
                    let pickedAlteration =
                        matchedAlteration === undefined
                            ? props.value[0]
                            : matchedAlteration;
                    content = (
                        <span>
                            {pickedAlteration} and{' '}
                            <DefaultTooltip
                                overlay={
                                    <div style={{ maxWidth: '400px' }}>
                                        {mergedAlteration}
                                    </div>
                                }
                                placement="right"
                                destroyTooltipOnHide={true}
                            >
                                <a>
                                    {props.value.length - 1} other alterations
                                </a>
                            </DefaultTooltip>
                        </span>
                    );
                }
                return (
                    <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                        {content}
                    </div>
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
            minWidth: 120,
            Cell: (props: { original: IndicatorQueryTreatment }) => (
                <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                    {getTumorTypeName(props.original.levelAssociatedCancerType)}
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
                    <DefaultTooltip
                        overlay={this.treatmentTooltipContent(
                            props.original.abstracts,
                            props.original.pmids.map(pmid => Number(pmid)),
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
