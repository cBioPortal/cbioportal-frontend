import * as React from 'react';
import { observer } from 'mobx-react';
import { IReactionDisposer, reaction } from 'mobx';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { FusionViewerStore } from './FusionViewerStore';
import { FusionListSidebar } from './FusionListSidebar';
import { FusionInfoBar } from './FusionInfoBar';
import { FusionDiagramSVG } from './FusionDiagramSVG';
import styles from './styles.module.scss';

interface IFusionViewerTabProps {
    structuralVariants: StructuralVariant[];
    referenceGenome?: string;
    /** Deep-linked fusion (`FusionEvent.id`, URL `fusionId`) to open on. */
    fusionId?: string;
    /** Called when the user selects a different fusion. */
    onFusionSelected?: (fusionId: string) => void;
}

@observer
export class FusionViewerTab extends React.Component<IFusionViewerTabProps> {
    private store: FusionViewerStore;
    private disposeSelectionReaction: IReactionDisposer;

    constructor(props: IFusionViewerTabProps) {
        super(props);
        this.store = new FusionViewerStore();
        this.store.setStructuralVariants(
            props.structuralVariants,
            props.referenceGenome,
            props.fusionId
        );
        // Mirror selection changes out (e.g. into the URL). Not fired for the
        // initial selection, so opening the tab doesn't rewrite the URL.
        this.disposeSelectionReaction = reaction(
            () => this.store.selectedFusionId,
            id => {
                if (id && id !== this.props.fusionId) {
                    this.props.onFusionSelected?.(id);
                }
            }
        );
    }

    componentDidUpdate(prevProps: IFusionViewerTabProps) {
        if (prevProps.structuralVariants !== this.props.structuralVariants) {
            this.store.setStructuralVariants(
                this.props.structuralVariants,
                this.props.referenceGenome,
                this.props.fusionId
            );
        } else if (prevProps.referenceGenome !== this.props.referenceGenome) {
            this.store.setReferenceGenome(this.props.referenceGenome);
        } else if (
            // URL changed underneath us (back/forward, pasted link).
            this.props.fusionId &&
            prevProps.fusionId !== this.props.fusionId &&
            this.props.fusionId !== this.store.selectedFusionId
        ) {
            this.store.selectFusion(this.props.fusionId);
        }
    }

    componentWillUnmount() {
        this.disposeSelectionReaction();
    }

    render() {
        const canonicalFusion = this.store.canonicalFusion;

        if (this.store.fusions.length === 0) {
            return (
                <div className={styles.fusionViewerTab}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            color: '#999',
                            fontSize: 14,
                        }}
                    >
                        No structural variant / fusion data available.
                    </div>
                </div>
            );
        }

        // A pending request still exposes the previous fusion's result, so any
        // pending side means loading -- never draw stale transcripts.
        const showLoading = this.store.transcriptsLoading;

        return (
            <div className={styles.fusionViewerTab}>
                <FusionListSidebar store={this.store} />
                <div className={styles.diagramPanel}>
                    <FusionInfoBar store={this.store} />
                    <div className={styles.diagramContainer}>
                        {showLoading ? (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: '#999',
                                }}
                            >
                                Loading transcript data...
                            </div>
                        ) : canonicalFusion && this.store.forteTranscript5p ? (
                            <FusionDiagramSVG
                                fusion={canonicalFusion}
                                forteTranscript5p={this.store.forteTranscript5p}
                                forteTranscript3p={this.store.forteTranscript3p}
                                userTranscripts5p={
                                    this.store.allSelectedTranscripts5p
                                }
                                userTranscripts3p={
                                    this.store.allSelectedTranscripts3p
                                }
                                activeTranscript5p={
                                    this.store.activeTranscript5p ||
                                    this.store.forteTranscript5p
                                }
                                activeTranscript3p={
                                    this.store.activeTranscript3p ||
                                    this.store.forteTranscript3p
                                }
                                onActivate5p={id =>
                                    this.store.setActiveTranscript5p(id)
                                }
                                onActivate3p={id =>
                                    this.store.setActiveTranscript3p(id)
                                }
                                showPromoter={this.store.showPromoter}
                            />
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: '#999',
                                }}
                            >
                                Select a fusion from the sidebar to view
                                details.
                            </div>
                        )}
                    </div>
                    {canonicalFusion &&
                        canonicalFusion.note &&
                        canonicalFusion.note !== 'NA' && (
                            <div className={styles.notePanel}>
                                {canonicalFusion.note}
                            </div>
                        )}
                </div>
            </div>
        );
    }
}

export default FusionViewerTab;
