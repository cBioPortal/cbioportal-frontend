import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import {
    getDigitalSlideArchiveIFrameUrl,
    getDigitalSlideArchiveMetaUrl,
} from '../../../shared/api/urls';
import './styles.module.scss';

interface IMinervaViewerProps {
    // Basic props for identification
    patientId?: string;
    cancerTypeId?: string;
    slideName?: string;
    url?: string;
    containerHeight: number;

    // Optional callback functions for integration with cBioPortal
    onImageLoad?: () => void;
    onSelectionChange?: (selection: any) => void;

    // Optional parameters for configuring the viewer
    initialZoom?: number;
    showControls?: boolean;
    enableAnnotations?: boolean;
}

const MinervaViewer: React.FC<IMinervaViewerProps> = props => {
    const {
        patientId,
        cancerTypeId,
        slideName,
        url,
        containerHeight,
        onImageLoad,
        onSelectionChange,
        initialZoom = 1,
        showControls = true,
        enableAnnotations = true,
    } = props;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [minervaInstance, setMinervaInstance] = useState<any>(null);
    const [slideMetadata, setSlideMetadata] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Function to construct the appropriate URL for Minerva
    const getMinervaUrl = (): string => {
        if (url) {
            return url;
        } else if (patientId && cancerTypeId) {
            // Use the utility function that was previously used for the iframe
            return getDigitalSlideArchiveIFrameUrl(patientId, cancerTypeId);
        }
        return '';
    };

    // Get metadata about available slides
    useEffect(() => {
        if (patientId) {
            fetch(getDigitalSlideArchiveMetaUrl(patientId))
                .then(response => response.json())
                .then(data => {
                    setSlideMetadata(data);
                })
                .catch(err => {
                    console.error('Failed to load slide metadata:', err);
                });
        }
    }, [patientId]);

    // Initialize Minerva viewer
    useEffect(() => {
        let mounted = true;
        const initializeMinerva = async () => {
            try {
                setIsLoading(true);

                await new Promise(resolve => setTimeout(resolve, 1000));

                // Create a placeholder Minerva instance
                const minervaInstance = {
                    zoomTo: (level: number) => {
                        console.log(`Zooming to level ${level}`);
                    },
                    panTo: (x: number, y: number) => {
                        console.log(`Panning to ${x}, ${y}`);
                    },
                    enableAnnotations: (enable: boolean) => {
                        console.log(`Setting annotations to ${enable}`);
                    },
                    getViewportDetails: () => {
                        return {
                            zoom: initialZoom,
                            center: { x: 0, y: 0 },
                            bounds: { width: 1000, height: 1000 },
                        };
                    },
                };

                if (mounted) {
                    setMinervaInstance(minervaInstance);
                    setIsLoading(false);
                    if (onImageLoad) {
                        onImageLoad();
                    }
                }
            } catch (e) {
                if (mounted) {
                    setError(`Failed to initialize Minerva: ${e}`);
                    setIsLoading(false);
                }
            }
        };

        initializeMinerva();

        return () => {
            mounted = false;
            if (minervaInstance) {
                console.log('Cleaning up Minerva instance');
            }
        };
    }, [patientId, cancerTypeId, slideName, url]);

    // Apply control settings
    useEffect(() => {
        if (minervaInstance) {
            if (initialZoom) {
                minervaInstance.zoomTo(initialZoom);
            }

            minervaInstance.enableAnnotations(enableAnnotations);
        }
    }, [minervaInstance, initialZoom, enableAnnotations]);

    // Handle selection changes
    const handleSelection = (selection: any) => {
        if (onSelectionChange) {
            onSelectionChange(selection);
        }
    };

    // For debugging - display the URL being used
    const displayUrl = getMinervaUrl();

    return (
        <div
            className="minervaContainer"
            style={{ height: containerHeight, width: '100%' }}
            ref={containerRef}
        >
            {isLoading && <LoadingIndicator isLoading={true} center={true} />}

            {error && (
                <div className="minervaError">
                    <p>{error}</p>
                    <button
                        onClick={() => {
                            setError(null);
                            setIsLoading(true);
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {!isLoading && !error && (
                <div className="minervaViewport">
                    <div style={{ padding: 20, textAlign: 'center' }}>
                        <h3>Minerva Viewer</h3>
                        <p>Connected to: {displayUrl}</p>

                        {patientId && <p>Patient ID: {patientId}</p>}

                        {cancerTypeId && <p>Cancer Type: {cancerTypeId}</p>}

                        {slideMetadata && (
                            <div>
                                <p>Available Slides: {slideMetadata.length}</p>
                            </div>
                        )}

                        {showControls && (
                            <div className="minervaControls">
                                <button
                                    onClick={() =>
                                        minervaInstance.zoomTo(
                                            initialZoom + 0.1
                                        )
                                    }
                                >
                                    Zoom In
                                </button>
                                <button
                                    onClick={() =>
                                        minervaInstance.zoomTo(
                                            initialZoom - 0.1
                                        )
                                    }
                                >
                                    Zoom Out
                                </button>
                                <button
                                    onClick={() =>
                                        handleSelection({ x: 100, y: 100 })
                                    }
                                >
                                    Select Region (Demo)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MinervaViewer;
