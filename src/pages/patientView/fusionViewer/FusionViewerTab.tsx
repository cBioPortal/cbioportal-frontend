import * as React from 'react';
import { observer } from 'mobx-react';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { FusionViewerStore } from './FusionViewerStore';
import { FusionListSidebar } from './FusionListSidebar';
import { FusionInfoBar } from './FusionInfoBar';
import { FusionDiagramSVG } from './FusionDiagramSVG';
import styles from './styles.module.scss';

interface IFusionViewerTabProps {
    structuralVariants: StructuralVariant[];
    referenceGenome?: string;
}

@observer
export class FusionViewerTab extends React.Component<IFusionViewerTabProps> {
    private store: FusionViewerStore;

    constructor(props: IFusionViewerTabProps) {
        super(props);
        this.store = new FusionViewerStore();
        this.store.setStructuralVariants(
            props.structuralVariants,
            props.referenceGenome
        );
    }

    componentDidUpdate(prevProps: IFusionViewerTabProps) {
        if (prevProps.structuralVariants !== this.props.structuralVariants) {
            this.store.setStructuralVariants(
                this.props.structuralVariants,
                this.props.referenceGenome
            );
        }
    }

    render() {
        const selectedFusion = this.store.selectedFusion;

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

        const showLoading =
            this.store.transcriptsLoading && !this.store.forteTranscript5p;

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
                        ) : selectedFusion && this.store.forteTranscript5p ? (
                            <FusionDiagramSVG
                                fusion={selectedFusion}
                                forteTranscript5p={this.store.forteTranscript5p}
                                forteTranscript3p={this.store.forteTranscript3p}
                                userTranscripts5p={
                                    this.store.allSelectedTranscripts5p
                                }
                                userTranscripts3p={
                                    this.store.allSelectedTranscripts3p
                                }
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
                    {selectedFusion &&
                        selectedFusion.note &&
                        selectedFusion.note !== 'NA' && (
                            <div className={styles.notePanel}>
                                {selectedFusion.note}
                            </div>
                        )}
                </div>
            </div>
        );
    }
}

export default FusionViewerTab;
