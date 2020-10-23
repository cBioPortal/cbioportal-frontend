import { action, computed } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Col, Row } from 'react-bootstrap';
import Spinner from 'react-spinkit';
import HeaderAnnotation from '../headerAnnotation/HeaderAnnotation';
import FeatureTable from '../featureTable/FeatureTable';
import { VariantStore } from '../../store/VariantStore';
import { variantToMutation } from '../../util/VariantUtil';
import './Variant.scss';

interface IVariantProps {
    variant: string;
    store?: VariantStore;
    mainLoadingIndicator?: JSX.Element;
}

export function initDefaultVariantStore(props: IVariantProps) {
    return new VariantStore(props.variant, '');
}

@observer
class Variant extends React.Component<IVariantProps> {
    constructor(props: IVariantProps) {
        super(props);
    }

    public render(): React.ReactNode {
        return this.isLoading ? (
            this.loadingIndicator
        ) : (
            <div className={'page-body variant-page'}>
                <Row>
                    <Col>
                        <HeaderAnnotation
                            annotation={this.variantStore.annotationSummary}
                            mutation={
                                variantToMutation(
                                    this.variantStore.annotationSummary
                                )[0]
                            }
                            variant={this.props.variant}
                            oncokbGenesMap={
                                this.variantStore.oncokbGenesMap.result
                            }
                            oncokb={this.oncokb}
                            selectedTranscript={
                                this.variantStore.selectedTranscript
                            }
                            isCanonicalTranscriptSelected={
                                this.isCanonicalTranscriptSelected
                            }
                            allValidTranscripts={this.allValidTranscripts}
                            onTranscriptSelect={this.onTranscriptSelect}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <FeatureTable
                            myVariantInfo={this.myVariantInfo}
                            annotationInternal={
                                this.variantStore.annotationSummary
                            }
                            variantAnnotation={this.variantAnnotation}
                            oncokb={this.oncokb}
                            isCanonicalTranscriptSelected={
                                this.isCanonicalTranscriptSelected!
                            }
                        />
                    </Col>
                </Row>
                {!this.isCanonicalTranscriptSelected && (
                    <div>
                        * This resource uses a transcript different from the
                        displayed one, but the genomic change is the same.
                    </div>
                )}
            </div>
        );
    }

    @computed
    protected get variantStore(): VariantStore {
        return this.props.store
            ? this.props.store!
            : initDefaultVariantStore(this.props);
    }

    @computed
    private get myVariantInfo() {
        return this.variantStore.annotation.result &&
            this.variantStore.annotation.result.my_variant_info
            ? this.variantStore.annotation.result.my_variant_info.annotation
            : undefined;
    }

    @computed
    private get oncokb() {
        return this.variantStore.oncokbData.result;
    }

    @computed
    private get variantAnnotation() {
        return this.variantStore.annotation.result
            ? this.variantStore.annotation.result
            : undefined;
    }

    @computed
    get isCanonicalTranscriptSelected() {
        if (this.variantStore.annotationSummary) {
            // no selection, canonical transcript will be selected as default
            return (
                this.variantStore.selectedTranscript === '' ||
                this.variantStore.selectedTranscript ===
                    this.variantStore.annotationSummary.canonicalTranscriptId
            );
        } else {
            return undefined;
        }
    }

    protected get isLoading() {
        return (
            this.variantStore.annotation.isPending ||
            this.variantStore.oncokbGenesMap.isPending ||
            this.variantStore.isAnnotatedSuccessfully.isPending
        );
    }

    protected get loadingIndicator() {
        return (
            this.props.mainLoadingIndicator || (
                <div className={'loadingIndicator'}>
                    <Spinner
                        noFadeIn={true}
                        spinnerName="three-bounce"
                        className={'loading-spinner'}
                    />
                </div>
            )
        );
    }

    @computed get allValidTranscripts() {
        if (
            this.variantStore.isAnnotatedSuccessfully.isComplete &&
            this.variantStore.isAnnotatedSuccessfully.result === true &&
            this.variantStore.getMutationMapperStore &&
            this.variantStore.getMutationMapperStore.transcriptsWithAnnotations
                .result &&
            this.variantStore.getMutationMapperStore.transcriptsWithAnnotations
                .result.length > 0
        ) {
            return this.variantStore.getMutationMapperStore
                .transcriptsWithAnnotations.result;
        }
        return [];
    }

    @action.bound
    private setActiveTranscript(transcriptId: string) {
        this.variantStore.getMutationMapperStore!.setSelectedTranscript(
            transcriptId
        );
        this.variantStore.selectedTranscript = transcriptId;
    }

    @action.bound
    private onTranscriptSelect(transcriptId: string) {
        this.setActiveTranscript(transcriptId);
    }
}

export default Variant;
