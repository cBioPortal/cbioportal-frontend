import * as React from "react";
import * as _ from 'lodash';
import {CancerStudy} from 'shared/api/generated/CBioPortalAPI';
import {ThreeBounce} from 'better-react-spinkit';
import request from 'superagent';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import TableHeaderControls from "shared/components/tableHeaderControls/TableHeaderControls";
import LazyMobXTable from "shared/components/lazyMobXTable/LazyMobXTable";


interface IDataTableRow {
    name: string;
    reference: string;
    studyId: string;
    pmid: string;
    all: number | string;
    sequenced: number | string;
    cna: number;
    mrnaRnaSeq: number | string;
    mrnaRnaSeqV2: number | string;
    mrnaMicroarray: number | string;
    miRna: number | string;
    methylation: number | string;
    rppa: number | string;
    complete: number | string;
    citation: string;
}

interface IDataSetsTableProps {
    className?: string;
    datasets: CancerStudy[];
}

interface IDataSetsTableState {
    downloadable: string[];
}

interface ICancerStudyCellProps {
    name: string;
    studyId: string;
}

interface IReferenceCellProps {
    citation: string;
    pmid: string;
}

class DataTable extends LazyMobXTable<IDataTableRow> {
}

class CancerStudyCell extends React.Component<ICancerStudyCellProps,{}> {

    render() {
        return (
            <span>
                <a
                    href={`./study?id=${this.props.studyId}#summary`}
                    target='_blank'
                >
                    {this.props.name}
                </a>
            </span>
        );

    }

}

class ReferenceCell extends React.Component<IReferenceCellProps ,{}> {

    render() {
        return (
            <a target='_blank'
               href={`https://www.ncbi.nlm.nih.gov/pubmed/${this.props.pmid}`}> {this.props.citation} </a>
        );

    }

}

export default class DataSetsPageTable extends React.Component <IDataSetsTableProps, IDataSetsTableState> {

    chartTarget:HTMLElement;

    constructor() {
        super();

        this.state = {
            downloadable: []
        };

    }

    componentDidMount() {

        const DATAHUB_GIT_URL = 'https://api.github.com/repos/cBioPortal/datahub/contents/public';

        request
            .get(DATAHUB_GIT_URL)
            .then((data:any) => {
                if (_.isArray(data.body) && data.body.length > 0) {
                    _.each(data.body, (fileInfo:{type?: string; name?: string; html_url:string;}) => {
                        if (_.isObject(fileInfo) && fileInfo.type === 'file' && _.isString(fileInfo.name)) {
                            const fileName = fileInfo.name.split('.tar.gz');
                            if (fileName.length > 0) {
                                this.setState ({
                                    downloadable: [
                                        ...this.state.downloadable, fileName[0]
                                    ]
                                });

                            }
                        }
                    });

                }
            });

    }



    render() {

        if (this.props.datasets) {

            const tableData: IDataTableRow[] = _.map(this.props.datasets, (study: CancerStudy) => ({
                name: study.name,
                reference: study.citation,
                all: study.allSampleCount || "",
                pmid: study.pmid,
                studyId: study.studyId,
                sequenced: study.sequencedSampleCount || "",
                cna: study.cnaSampleCount,
                citation: study.citation || "",
                mrnaRnaSeq: study.mrnaRnaSeqSampleCount || "",
                mrnaRnaSeqV2: study.mrnaRnaSeqV2SampleCount || "",
                mrnaMicroarray: study.mrnaMicroarraySampleCount || "",
                miRna: study.miRnaSampleCount || "",
                methylation: study.methylationHm27SampleCount || "",
                rppa: study.rppaSampleCount || "",
                complete: study.completeSampleCount || ""
            }));
            return (
                <div ref={(el:HTMLDivElement) => this.chartTarget = el}>
                    <DataTable
                        data={tableData}
                        columns={
                            [
                                {
                                    name:'Name',
                                    type: 'name',
                                    render:(data:IDataTableRow)=> <CancerStudyCell studyId={data.studyId} name={data.name}/>,
                                    filter:(data:any, filterString:string, filterStringUpper:string) => {
                                        return data.name.toUpperCase().indexOf(filterStringUpper) > -1;
                                     }

                                },
                                {name:'', sortBy:false, togglable:false, download: false, type:'download', render:(data:IDataTableRow)=> {
                                    const download = this.state.downloadable.indexOf(data.studyId) > -1;
                                    return (
                                        <a className="dataset-table-download-link" style={download ? {display:'block'} : {display:'none'}}
                                           href={'https://media.githubusercontent.com/media/cBioPortal/datahub/master/public/' + data.studyId + '.tar.gz'} download>
                                            <i className='fa fa-download'/>
                                        </a>
                                    );
                                }},
                                {
                                    name:'Reference',
                                    type: 'citation', render:(data:IDataTableRow)=><ReferenceCell pmid={data.pmid} citation={data.citation}/>,
                                     filter:(data:any, filterString:string, filterStringUpper:string) => {
                                        return data.citation.toUpperCase().indexOf(filterStringUpper) > -1;
                                     }

                                },
                                {name:'All', type: 'all'},
                                {name:'Sequenced', type: 'sequenced'},
                                {name:'CNA', type: 'cna'},
                                {name:'RNA-Seq', type: 'mrnaRnaSeq'},
                                {name:'Tumor mRNA (microarray)', type: 'mrnaMicroarray', visible:false},
                                {name:'Tumor miRNA', type: 'miRna', visible:false },
                                {name:'Methylation (HM27)', type: 'methylation', visible:false },
                                {name:'RPPA', type: 'rppa', visible:false },
                                {name:'Complete', type: 'complete', visible:false },
                            ].map((column:any) => (
                                {
                                    visible:(column.visible === false) ? false : true,
                                    togglable:(column.togglable === false) ? false : true,
                                    name: column.name,
                                    defaultSortDirection:'asc' as 'asc',
                                    sortBy: (column.hasOwnProperty('sortBy')) ? column.sortBy : ((data:any)=>(data[column.type])),
                                    render: column.hasOwnProperty('render') ? column.render : (data:any) => {
                                        const style = {};// {textAlign: 'center', width: '100%', display: 'block'}
                                        if(column.type === 'mrnaRnaSeq') {
                                            return (
                                                <span style={style}>
                                                    {Number(data.mrnaRnaSeqV2) || Number(data.mrnaRnaSeq) || 0}
                                                </span>
                                            );
                                        } else {
                                            return <span style={{style}}>{data[column.type] || 0}</span>;
                                        }
                                    },
                                    download: column.hasOwnProperty('download') ? column.download : false,
                                    filter: column.filter || undefined
                                }
                            ))
                        }
                        initialSortColumn={'Name'}
                        initialSortDirection={'asc'}
                        showPagination={false}
                        showColumnVisibility={true}
                        showFilter={true}
                        showCopyDownload={false}
                        initialItemsPerPage={this.props.datasets.length}
                    />
                </div>
            );

        } else {
            return <div><ThreeBounce/></div>;
        }
    }

}


