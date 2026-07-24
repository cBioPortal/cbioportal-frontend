import * as React from 'react';
import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import {
    TableCellStatusIndicator,
    TableCellStatus,
} from 'cbioportal-frontend-commons';
import TextExpander from 'shared/components/TextExpander';
import {
    fetchAlphaFoldPredictionMetadataCached,
    generateAlphaFoldInfoSummary,
    getAlphaFoldEntryUrl,
    getAlphaFoldModelId,
} from './AlphaFoldUtils';

export interface IAlphaFoldChainInfoProps {
    uniprotId: string;
    chainId: string;
    isoform?: number;
    truncateText?: boolean;
    summaryFormat?: boolean;
    alphafoldApiBaseUrl?: string;
}

@observer
export default class AlphaFoldChainInfo extends React.Component<
    IAlphaFoldChainInfoProps,
    {}
> {
    @observable private modelInfo: string | null = null;
    @observable private moleculeInfo: string | null = null;
    @observable private entryId: string = '';
    @observable private status: 'loading' | 'complete' | 'error' | 'na' =
        'loading';

    constructor(props: IAlphaFoldChainInfoProps) {
        super(props);
        makeObservable(this);
        this.loadMetadata = this.loadMetadata.bind(this);
    }

    public componentDidMount() {
        this.loadMetadata();
    }

    public componentDidUpdate(prevProps: IAlphaFoldChainInfoProps) {
        if (
            prevProps.uniprotId !== this.props.uniprotId ||
            prevProps.isoform !== this.props.isoform ||
            prevProps.alphafoldApiBaseUrl !== this.props.alphafoldApiBaseUrl
        ) {
            this.loadMetadata();
        }
    }

    @action
    private async loadMetadata() {
        this.status = 'loading';
        this.modelInfo = null;
        this.moleculeInfo = null;
        this.entryId = getAlphaFoldModelId(
            this.props.uniprotId,
            this.props.isoform
        );

        try {
            const metadata = await fetchAlphaFoldPredictionMetadataCached(
                this.props.uniprotId,
                this.props.alphafoldApiBaseUrl,
                this.props.isoform
            );

            if (!metadata) {
                this.status = 'na';
                this.modelInfo = `AlphaFold predicted structure for UniProt ${this.props.uniprotId.toUpperCase()}`;
                this.moleculeInfo = null;
                return;
            }

            const summary = generateAlphaFoldInfoSummary(metadata);

            this.entryId = summary.entryId;
            this.modelInfo = summary.modelInfo;
            this.moleculeInfo = summary.moleculeInfo;
            this.status = 'complete';
        } catch (error) {
            this.status = 'error';
        }
    }

    private renderInfoText(text: string | null) {
        if (this.status === 'loading') {
            return <TableCellStatusIndicator status={TableCellStatus.LOADING} />;
        }

        if (this.status === 'error') {
            return <TableCellStatusIndicator status={TableCellStatus.ERROR} />;
        }

        if (this.status === 'na' || !text) {
            return <TableCellStatusIndicator status={TableCellStatus.NA} />;
        }

        if (this.props.truncateText) {
            return <TextExpander text={text} />;
        }

        return <span>{text}</span>;
    }

    public render() {
        const displayId =
            this.entryId ||
            getAlphaFoldModelId(this.props.uniprotId, this.props.isoform);

        return (
            <div className={this.props.truncateText ? 'col col-sm-12' : ''}>
                <div className={this.props.truncateText ? 'row' : ''}>
                    <div className="pull-left" style={{ paddingRight: 5 }}>
                        <span
                            style={{
                                fontWeight: this.props.summaryFormat
                                    ? 'bold'
                                    : 'normal',
                            }}
                        >
                            <span>
                                {this.props.summaryFormat
                                    ? 'alphafold'
                                    : 'AlphaFold'}
                            </span>
                            {!this.props.summaryFormat && (
                                <span style={{ paddingLeft: 5 }}>
                                    <a
                                        href={getAlphaFoldEntryUrl(
                                            this.props.uniprotId
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <b>{displayId}</b>
                                    </a>
                                </span>
                            )}
                            <span>:</span>
                        </span>
                    </div>
                    <div data-test="alphafoldChainInfoText">
                        {this.renderInfoText(this.modelInfo)}
                    </div>
                </div>
                <div className={this.props.truncateText ? 'row' : ''}>
                    <div className="pull-left" style={{ paddingRight: 5 }}>
                        <span
                            style={{
                                fontWeight: this.props.summaryFormat
                                    ? 'bold'
                                    : 'normal',
                            }}
                        >
                            <span>
                                {this.props.summaryFormat ? 'chain' : 'Chain'}
                            </span>
                            {!this.props.summaryFormat && (
                                <span style={{ paddingLeft: 3 }}>
                                    <b>{this.props.chainId}</b>
                                </span>
                            )}
                            <span>:</span>
                        </span>
                    </div>
                    <div>
                        {this.renderInfoText(this.moleculeInfo)}
                    </div>
                </div>
            </div>
        );
    }
}
