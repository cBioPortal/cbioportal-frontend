import * as React from 'react';
import {computed} from "mobx";
import {observer} from "mobx-react";
import {PostTranslationalModification} from "shared/api/generated/GenomeNexusAPI";
import LazyMobXTable, {Column} from "shared/components/lazyMobXTable/LazyMobXTable";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import ReferenceList from "shared/components/annotation/oncokb/ReferenceList";
import PubMedCache from "shared/cache/PubMedCache";
import {ICache} from "shared/lib/SimpleCache";

export interface IPtmSummaryTableProps
{
    data: PostTranslationalModification[];
    pubMedCache?: PubMedCache;
    initialSortColumn?: string;
    initialSortDirection?: 'asc'|'desc';
    initialItemsPerPage?: number;
}

// LazyMobXTable is a generic component which requires data type argument
class PtmTable extends LazyMobXTable<PostTranslationalModification> {}

function extractNumericalPart(pmid: string) {
    const matched = pmid.match(/[0-9]+/);

    if (matched) {
        return Number(matched[0]);
    }
    else {
        return undefined;
    }
}

@observer
export default class PtmAnnotationTable extends React.Component<IPtmSummaryTableProps, {}>
{
    public static defaultProps = {
        data: [],
        initialSortColumn: "Type",
        initialSortDirection: "asc",
        initialItemsPerPage: 10
    };

    constructor(props: IPtmSummaryTableProps)
    {
        super(props);
        this.state = {};
    }

    @computed
    get pmidData(): ICache<any> {

        if (this.props.pubMedCache) {
            this.props.data.forEach(ptm =>
                ptm.pubmedIds.forEach(id =>
                    this.props.pubMedCache!.get(Number(id))));
        }

        return (this.props.pubMedCache && this.props.pubMedCache.cache) || {};
    }

    @computed
    get columns() {
        return [
            {
                name: "Position",
                order: 1.00,
                render: (d: PostTranslationalModification) => (<div style={{textAlign: "right"}}>{d.position}</div>),
                sortBy: (d: PostTranslationalModification) => d.position
            },
            {
                name: "Type",
                order: 2.00,
                render: (d: PostTranslationalModification) => <div>{d.type}</div>,
                sortBy: (d: PostTranslationalModification) => d.type
            },
            {
                name: "",
                order: 3.00,
                render: (d: PostTranslationalModification) => (
                    <DefaultTooltip
                        placement="right"
                        overlay={
                            <div style={{maxWidth: 400, maxHeight: 400, overflowY: "auto"}}>
                                <ReferenceList
                                    pmids={
                                        d.pubmedIds
                                            .map(id => extractNumericalPart(id))
                                            .filter(id => id !== undefined) as number[]
                                    }
                                    pmidData={this.pmidData}
                                    abstracts={[]}
                                />
                            </div>
                        }
                        destroyTooltipOnHide={true}
                    >
                        <div style={{textAlign: "right"}}>
                            <i className="fa fa-book" style={{color: "black"}}/>
                        </div>
                    </DefaultTooltip>
                )
            }
        ];
    }

    public render()
    {
        const {
            data,
            initialSortColumn,
            initialSortDirection,
            initialItemsPerPage,
        } = this.props;

        const showPagination = data.length >
            (this.props.initialItemsPerPage || PtmAnnotationTable.defaultProps.initialItemsPerPage);

        return (
            <div className='cbioportal-frontend'>
                <PtmTable
                    data={data}
                    columns={this.columns}
                    initialSortColumn={initialSortColumn}
                    initialSortDirection={initialSortDirection}
                    initialItemsPerPage={initialItemsPerPage}
                    showCopyDownload={false}
                    showColumnVisibility={false}
                    showFilter={false}
                    showPagination={showPagination}
                    showPaginationAtTop={true}
                    paginationProps={{showMoreButton:false}}
                />
            </div>
        );
    }
}
