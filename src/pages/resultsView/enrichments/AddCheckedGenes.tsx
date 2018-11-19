import * as React from 'react';
import { observer } from "mobx-react";
import { observable } from 'mobx';
import { Button } from 'react-bootstrap';
import { ResultsViewPageStore } from 'pages/resultsView/ResultsViewPageStore';
import autobind from 'autobind-decorator';
import {QueryParameter} from "../../../shared/lib/ExtendedRouterStore";
import {ResultsViewTab} from "../ResultsViewPageHelpers";

export interface IAddCheckedGenesProps {
    checkedGenes:  string[];
    store: ResultsViewPageStore;
}

@observer
export default class AddCheckedGenes extends React.Component<IAddCheckedGenesProps, {}> {

    @autobind
    private onAddGenes() {
        // add genes and go back to oncoprint tab
        (window as any).routingStore.updateRoute({
            [QueryParameter.GENE_LIST]: `${(window as any).routingStore.query[QueryParameter.GENE_LIST]}\n${this.props.checkedGenes.join(" ")}`
        }, `results/${ResultsViewTab.ONCOPRINT}`);
    }

    public render() {

        return (
            <div style={{ marginBottom: 5 }}>
                <Button style={{ marginBottom: 2 }} disabled={this.props.checkedGenes.length < 1} onClick={this.onAddGenes}
                    bsSize="xsmall">Add checked genes to query:</Button>{" "}
                {this.props.checkedGenes.join(", ")}
            </div>
        );
    }
}
