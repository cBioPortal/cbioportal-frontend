import * as React from 'react';
import { observer } from 'mobx-react';
import { ResultsViewPageStore } from './ResultsViewPageStore';
import { MakeMobxView } from '../../shared/components/MobxView';

export interface INotUsingGenePanelWarningProps {
    store: ResultsViewPageStore;
}

@observer
export default class NotUsingGenePanelWarning extends React.Component<
    INotUsingGenePanelWarningProps,
    {}
> {
    readonly ui = MakeMobxView({
        await: () => [
            this.props.store.existUnsequencedSamplesInAGene,
            this.props.store.genes,
        ],
        render: () => {
            if (this.props.store.existUnsequencedSamplesInAGene.result) {
                let message = '';
                if (this.props.store.genes.result!.length > 1) {
                    message =
                        'The results below do not reflect gene panel data. Samples which were not profiled for some or all of the queried genes are included in the analysis below.';
                } else {
                    message =
                        'The results below do not reflect gene panel data. Samples which were not profiled for the queried gene are included in the analysis below.';
                }
                return (
                    <div className="alert alert-warning">
                        <span style={{ verticalAlign: 'middle' }}>
                            <i
                                className={'fa fa-md fa-exclamation-triangle'}
                                style={{
                                    verticalAlign: 'middle !important',
                                    marginRight: 6,
                                    marginBottom: 1,
                                }}
                            />
                            {message}
                        </span>
                    </div>
                );
            } else {
                return null;
            }
        },
    });

    render() {
        return this.ui.component;
    }
}
