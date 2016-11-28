import * as React from "react";
import { actionCreators, mapStateToProps } from './duck';
import { connect } from 'react-redux';
import { Table, unsafe }  from 'reactableMSK';
import * as _ from 'underscore';
import Connector, { DatasetDownloads } from './Connector';

export interface IDatasetPageUnconnectedProps {

    datasets:Array<any> | null;
    loadDatasetsInfo?:void;

};

@Connector.decorator
export default class DataSetPageUnconnected extends React.Component<IDatasetPageUnconnectedProps, {}> {

    componentDidMount() {

        this.props.loadDatasetsInfo();

    }

    render() {
        if (this.props.datasets) {
            const rows: Array<any> = [];
            this.props.datasets.forEach((item) => {
                const tempObj: any = {
                    "CancerStudy": unsafe(`<a href='http://www.cbioportal.org/study?id=${ item.cancer_study_identifier }#summary' target='_blank'> ${ item.name } </a>  <a href='https://github.com/cBioPortal/datahub/blob/master/public/${ item.cancer_study_identifier }.tar.gz' download><i class='fa fa-download'></i></a>`),
                    "Reference": unsafe(`<a target='_blank' href='https://www.ncbi.nlm.nih.gov/pubmed/${ item.pmid }'>${ item.citation }</a>`),
                    "All": item.all,
                    "Sequenced": item.sequenced,
                    "CNA": item.cna,
                    "Tumor mRNA (RNA-Seq V2)": item.rna_seq_v2_mrna,
                    "Tumor mRNA (microarray)": item.microrna,
                    "Tumor miRNA": item.mrna,
                    "Methylation (HM27)": item.methylation_hm27,
                    "RPPA": item.rppa,
                    "Complete": item.complete
                };
                rows.push(tempObj);
            });
            return <Table className="table" data={rows} sortable={true}
                          filterable={['CancerStudy','Reference','All','Sequenced','CNA','Tumor mRNA (RNA-Seq V2)','Tumor mRNA (microarray)','Tumor miRNA','Methylation (HM27)','RPPA','Complete']}/>;
        } else {
            return <div>loading</div>
        }
    }
}
;

//export default connect(mapStateToProps, actionCreators)(DataSetPageUnconnected);





