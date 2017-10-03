import * as React from "react";
import * as _ from 'lodash';
import { Table, Tr, Td } from 'reactableMSK';
import { CancerStudy } from 'shared/api/generated/CBioPortalAPI';
import {ThreeBounce} from 'better-react-spinkit';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import TableHeaderControls from "shared/components/tableHeaderControls/TableHeaderControls";
import LazyMobXTable from "shared/components/lazyMobXTable/LazyMobXTable";


interface IDataTableRow {
    name:string;
    reference:string;
    studyId: string;
    pmid: string;
    all:number | string;
    sequenced:number | string;
    cna:number;
    mrnaRnaSeq: number | string;
    mrnaRnaSeqV2: number | string;
    mrnaMicroarray: number | string;
    miRna: number | string;
    methylation: number | string;
    rppa: number | string;
    complete:number | string;
    citation:string;
}

interface IDataSetsTableProps {
    className?:string;
    datasets:CancerStudy[];
}

interface ICancerStudyCellProps {
    name: string;
    studyId: string;
}

interface IReferenceCellProps {
    citation: string;
    pmid: string;
}

class DataTable extends LazyMobXTable<IDataTableRow> {}

class CancerStudyCell extends React.Component<ICancerStudyCellProps,{}> {

    render() {
        return (
            <span>
                <a
                    href={`study?id=${this.props.studyId}#summary`}
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
            <a target='_blank' href={`https://www.ncbi.nlm.nih.gov/pubmed/${this.props.pmid}`}> {this.props.citation} </a>
        );

    }

}

export default class DataSetsPageTable extends React.Component <IDataSetsTableProps, {}> {

    render() {

        if (this.props.datasets) {

            const tableData:IDataTableRow[] = _.map(this.props.datasets, (study: CancerStudy) => ({
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
                <div>
                    <DataTable
                        data={tableData}
                        columns={
                            [
                                {name:'Name', type: 'name', render:(data:IDataTableRow)=> <CancerStudyCell studyId={data.studyId} name={data.name}/>},
                                {name:'', sortBy:false, togglable:false, download:false, type:'download', render:(data:IDataTableRow)=>{
                                    return (
                                        <a style={{width:50, display:'block' }} href={`https://github.com/cBioPortal/datahub/blob/master/public/${data.studyId}.tar.gz`} download>
                                            <i className='fa fa-download'/>
                                        </a>

                                    )
                                }},
                                {name:'Reference', type: 'citation', render:(data:IDataTableRow)=><ReferenceCell pmid={data.pmid} citation={data.citation}/>},
                                {name:'All', type: 'all'},
                                {name:'Sequenced', type: 'sequenced'},
                                {name:'CNA', type: 'cna'},
                                {name:'Tumor mRNA (RNA-Seq)', type: 'mrnaRnaSeq'},
                                {name:'Tumor mRNA (microarray)', type: 'mrnaMicroarray', visible:true},
                                {name:'Tumor miRNA', type: 'miRna', visible:false },
                                {name:'Methylation (HM27)', type: 'methylation', visible:false },
                                {name:'RPPA', type: 'rppa', visible:false },
                                {name:'Complete', type: 'complete' },
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
                                                 {Number(data.mrnaRnaSeqV2) || Number(data.mrnaRnaSeq)}
                                            </span>
                                            );
                                        } else {
                                            return <span style={{style}}>{data[column.type]}</span>;
                                        }
                                    },
                                    download: column.hasOwnProperty('download') ? column.download : true,
                                    filter: (data:any, filterString:string, filterStringUpper:string) => {
                                        if (column.hasOwnProperty('render')) {
                                            return data[column.type].toUpperCase().indexOf(filterStringUpper) > -1;
                                        } else {
                                            return data[column.type].toString().indexOf(filterString) > -1;
                                        }
                                    }}
                            ))
                        }
                        initialSortColumn={'Name'}
                        initialSortDirection={'asc'}
                        showPagination={false}
                        showColumnVisibility={true}
                        showFilter={true}
                        showCopyDownload={false}
                    />
                </div>
            );

        } else {
            return <div><ThreeBounce/></div>;
        }
    }

}


