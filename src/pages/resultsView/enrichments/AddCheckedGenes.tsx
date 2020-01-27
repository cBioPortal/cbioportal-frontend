import * as React from 'react';
import { observer } from 'mobx-react';
import { Button } from 'react-bootstrap';
import autobind from 'autobind-decorator';
import { ResultsViewTab } from '../ResultsViewPageHelpers';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { ResultsViewURLQueryEnum } from 'pages/resultsView/ResultsViewURLWrapper';

export interface IAddCheckedGenesProps {
    checkedGenes: string[];
}

@observer
export default class AddCheckedGenes extends React.Component<
    IAddCheckedGenesProps,
    {}
> {
    @autobind
    private onAddGenes() {
        // add genes and go back to oncoprint tab
        (window as any).routingStore.updateRoute(
            {
                [ResultsViewURLQueryEnum.gene_list]: `${
                    (window as any).routingStore.query[
                        ResultsViewURLQueryEnum.gene_list
                    ]
                }\n${this.props.checkedGenes.join(' ')}`,
            },
            `results/${ResultsViewTab.ONCOPRINT}`
        );
    }

    public render() {
        const geneText =
            this.props.checkedGenes.length > 0
                ? `(${this.props.checkedGenes.join(', ')})`
                : '(none checked)';
        return (
            <div style={{ marginBottom: 15 }}>
                <DefaultTooltip overlay={'Check genes in table below'}>
                    <Button
                        style={{ marginBottom: 2 }}
                        disabled={this.props.checkedGenes.length < 1}
                        onClick={this.onAddGenes}
                        bsSize="xsmall"
                    >
                        Add checked genes to query {geneText}
                    </Button>
                </DefaultTooltip>
            </div>
        );
    }
}
