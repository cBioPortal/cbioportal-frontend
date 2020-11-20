import * as _ from 'lodash';
import * as React from 'react';
import $ from 'jquery';
import igv from 'igv';
import autobind from 'autobind-decorator';

import onNextRenderFrame from 'shared/lib/onNextRenderFrame';
import { getModifiedTrackNames, keyTracksByName } from 'shared/lib/IGVUtils';

export type TrackProps = any; // TODO add typedef for tracks

type IGVProps = {
    genome?: string;
    tracks?: TrackProps[];
    locus?: string | string[];
    onLocusChange?: (str: string) => void;
    disableSearch?: boolean;
    isVisible?: boolean;
    onRenderingStart?: () => void;
    onRenderingComplete?: () => void;
};

export default class IntegrativeGenomicsViewer extends React.Component<
    IGVProps,
    {}
> {
    public static defaultProps = {
        genome: 'hg19',
        locus: 'all',
        disableSearch: false,
    };

    private igvDiv: HTMLDivElement | undefined;
    private igvBrowser: any;

    private modifiedTrackNames: string[] | undefined;
    private lastRenderedTracks: TrackProps[] | undefined;

    constructor(props: IGVProps) {
        super(props);
    }

    public render() {
        return (
            <div>
                <div ref={this.igvDivRefHandler} className="igvContainer" />
            </div>
        );
    }

    public get tracksByName(): { [trackName: string]: TrackProps } {
        return keyTracksByName(this.props.tracks);
    }

    componentDidMount() {
        if (this.props.onRenderingStart) {
            this.props.onRenderingStart();
        }

        const browserProps = {
            genome: this.props.genome,
            locus: this.props.locus,
            onLocusChange: this.props.onLocusChange,
        };

        igv.createBrowser(this.igvDiv, browserProps).then((browser: any) => {
            this.igvBrowser = browser;

            if (this.igvDiv) {
                this.updateSearch(this.igvDiv, this.props.disableSearch);
            }

            // deep clone, because loadTrackList method mutates the tracks object
            this.loadTrackList(browser, _.cloneDeep(this.props.tracks));

            // we need to store the list of last rendered tracks for a future comparison in the shouldComponentUpdate method,
            // because the component may still receive props when it is not visible
            this.lastRenderedTracks = this.props.tracks;

            if (this.props.onRenderingComplete) {
                this.props.onRenderingComplete();
            }
        });
    }

    shouldComponentUpdate(nextProps: IGVProps) {
        let shouldUpdate = false;

        if (nextProps.isVisible !== false) {
            // get a list of modified tracks, we are going to update only the modified ones
            const modifiedTrackNames = getModifiedTrackNames(
                this.lastRenderedTracks || [],
                nextProps.tracks || []
            );

            const genomeChanged = this.props.genome !== nextProps.genome;
            const locusChanged = this.props.locus !== nextProps.locus;
            const searchUpdated =
                this.props.disableSearch !== nextProps.disableSearch;

            shouldUpdate =
                genomeChanged ||
                modifiedTrackNames.length > 0 ||
                locusChanged ||
                searchUpdated;

            if (shouldUpdate) {
                // update the class reference, since we need the modified tracks names in the componentDidUpdate method
                this.modifiedTrackNames = modifiedTrackNames;
            }
        }

        return shouldUpdate;
    }

    componentDidUpdate() {
        // update locus
        if (this.igvBrowser && this.props.locus) {
            this.igvBrowser.search(this.props.locus);
        }

        // update tracks
        if (
            this.igvBrowser &&
            this.modifiedTrackNames &&
            this.modifiedTrackNames.length > 0
        ) {
            this.updateTracks(
                this.igvBrowser,
                this.modifiedTrackNames,
                this.tracksByName
            );

            this.modifiedTrackNames = undefined;
            // update the list of last rendered tracks after each update
            this.lastRenderedTracks = this.props.tracks;
        }

        // enable/disable search
        if (this.igvDiv) {
            this.updateSearch(this.igvDiv, this.props.disableSearch);
        }
    }

    private loadTrackList(igvBrowser: any, tracks: TrackProps[] | undefined) {
        igvBrowser
            .loadTrackList(tracks)
            .then(() => {
                if (this.props.onRenderingComplete) {
                    this.props.onRenderingComplete();
                }
            })
            .catch(() => {
                if (this.props.onRenderingComplete) {
                    this.props.onRenderingComplete();
                }
            });
    }

    private updateTracks(
        igvBrowser: any,
        modifiedTrackNames: string[],
        tracksByName: { [trackName: string]: TrackProps }
    ) {
        // first, remove all tracks to update
        modifiedTrackNames.forEach(name => igvBrowser.removeTrackByName(name));

        const tracksToLoad = modifiedTrackNames
            .map(name => _.cloneDeep(tracksByName[name]))
            .filter(track => track !== undefined);

        // reload each modified track
        if (tracksToLoad.length > 0) {
            if (this.props.onRenderingStart) {
                this.props.onRenderingStart();
            }

            // need to start loading on next render frame to be able to show "rendering" information in the loader
            onNextRenderFrame(() => {
                this.loadTrackList(igvBrowser, tracksToLoad);
            });
        }
    }

    private updateSearch(igvDiv: HTMLDivElement, disableSearch?: boolean) {
        const chrDropdown = $(igvDiv).find(
            '.igv-chromosome-select-widget-container select'
        );
        const locusSearchBox = $(igvDiv).find('.igv-search-container input');

        if (disableSearch) {
            locusSearchBox.attr('disabled', 'true');
            chrDropdown.attr('disabled', 'true');
        } else {
            locusSearchBox.attr('disabled', null);
            chrDropdown.attr('disabled', null);
        }
    }

    @autobind
    private igvDivRefHandler(div: HTMLDivElement) {
        this.igvDiv = div;
    }
}
