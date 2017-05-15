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
                    href={`http://www.cbioportal.org/study?id=${this.props.studyId}#summary`}
                    target='_blank'
                >
                    {this.props.name}
                </a>&nbsp;
                <a href={`https://github.com/cBioPortal/datahub/blob/master/public/${this.props.studyId}.tar.gz`} download>
                    <i className='fa fa-download' style={{float:"right"}}/>
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
                mrnaRnaSeq: study.mrnaRnaSeqV2SampleCount || "",
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
                                {name:'Reference', type: 'citation', render:(data:IDataTableRow)=><ReferenceCell pmid={data.pmid} citation={data.citation}/>},
                                {name:'All', type: 'all'},
                                {name:'Sequenced', type: 'sequenced'},
                                {name:'CNA', type: 'cna'},
                                {name:'Tumor mRNA (RNA-Seq)', type: 'mrnaRnaSeq'},
                                {name:'Tumor mRNA (microarray)', type: 'mrnaMicroarray'},
                                {name:'Tumor miRNA', type: 'miRna'},
                                {name:'Methylation (HM27)', type: 'methylation'},
                                {name:'RPPA', type: 'rppa'},
                                {name:'Complete', type: 'complete'},
                            ].map((column) => (
                                {name: column.name,
                                 defaultSortDirection:'asc' as 'asc',
                                 sortBy:(data:IDataTableRow)=>(data[column.type]),
                                 render: column.render ? column.render : (data:IDataTableRow) => (
                                     <span style={{textAlign: 'center', width: '100%', display: 'block'}}>{data[column.type]}</span>
                                 )}
                            ))
                        }
                        initialSortColumn={'Name'}
                        initialSortDirection={'asc'}
                        showPagination={false}
                        showColumnVisibility={false}
                    />
                </div>
            );

        } else {
            return <div><ThreeBounce/></div>;
        }
    }

}


