/**
 * Unified Chromoscope visualization component
 * Displays circular genome overview and linear variant detail view in a single Gosling instance
 * Based on Chromoscope's architecture for proper brush linking functionality
 */
import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';
import { GoslingComponent, GoslingRef, GoslingSpec } from 'gosling.js';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

export interface ChromoscopeData {
    chrom1: string;
    start1: number;
    end1: number;
    chrom2: string;
    start2: number;
    end2: number;
    strand1: string;
    strand2: string;
    sv_id: string;
    svclass: string;
    [key: string]: any;
}

interface IChromoscopeViewProps {
    /**
     * Structural variant data in Gosling-compatible format
     */
    data: ChromoscopeData[];
    /**
     * Reference genome assembly version
     */
    assembly?: string;
    /**
     * Component width in pixels
     */
    width?: number;
    /**
     * Component height in pixels
     */
    height?: number;
    /**
     * Currently selected structural variant ID for highlighting
     */
    selectedId?: string;
    /**
     * Genomic region to display [chromosome, start, end]
     */
    xDomain?: [string, number, number];
    /**
     * Callback when user clicks on a structural variant
     */
    onClick?: (svId: string) => void;
    /**
     * Loading state
     */
    isLoading?: boolean;
}

/**
 * Color scheme for structural variant types
 */
const SV_COLORS = {
    domain: [
        'Translocation',
        'Duplication',
        'Deletion',
        'Inversion (TtT)',
        'Inversion (HtH)',
    ],
    range: ['lightgrey', '#409F7A', '#3275B4', '#CC7DAA', '#E6A01B'],
};

/**
 * Gosling theme matching Chromoscope
 */
const THEME = {
    base: 'light',
    root: {
        background: 'white',
        titleAlign: 'middle',
        titleColor: 'black',
        titleFontSize: 18,
        titleFontFamily: 'Arial',
        titleFontWeight: 'normal',
    },
    legend: {
        labelFontFamily: 'Arial',
    },
    axis: {
        labelFontFamily: 'Arial',
        labelFontSize: 14,
    },
} as const;

@observer
export default class ChromoscopeView extends React.Component<
    IChromoscopeViewProps
> {
    @observable private isInitialized = false;

    private goslingRef = React.createRef<GoslingRef>();

    public static defaultProps: Partial<IChromoscopeViewProps> = {
        assembly: 'hg38',
        width: 1200,
        height: 400,
        isLoading: false,
    };

    constructor(props: IChromoscopeViewProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        this.setupEventListeners();
        this.isInitialized = true;
    }

    componentWillUnmount() {
        this.cleanupEventListeners();
    }

    /**
     * Set up Gosling event listeners for user interactions
     */
    private setupEventListeners() {
        setTimeout(() => {
            if (this.goslingRef.current?.api) {
                this.goslingRef.current.api.subscribe(
                    'click',
                    this.handleClick
                );
            }
        }, 100);
    }

    /**
     * Clean up event listeners to prevent memory leaks
     */
    private cleanupEventListeners() {
        if (this.goslingRef.current?.api) {
            this.goslingRef.current.api.unsubscribe('click');
        }
    }

    /**
     * Generate unified Gosling specification with circular overview and linear detail
     */
    @computed
    private get goslingSpec(): GoslingSpec | null {
        if (!this.props.data || this.props.data.length === 0) {
            return null;
        }

        const circularWidth = Math.min(this.props.height!, 400);
        const linearWidth = this.props.width! - circularWidth - 20;

        return {
            arrangement: 'horizontal',
            spacing: 20,
            views: [
                this.generateCircularOverviewSpec(circularWidth),
                this.generateLinearDetailSpec(linearWidth),
            ],
        };
    }

    /**
     * Generate circular overview specification
     */
    private generateCircularOverviewSpec(width: number) {
        return {
            static: true,
            layout: 'circular',
            spacing: 1,
            style: {
                outlineWidth: 1,
                outline: 'lightgray',
            },
            tracks: [
                {
                    id: 'circular-ideogram',
                    alignment: 'overlay',
                    data: {
                        url:
                            this.props.assembly === 'hg38'
                                ? 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv'
                                : 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG19.Human.CytoBandIdeogram.csv',
                        type: 'csv',
                        chromosomeField: 'Chromosome',
                        genomicFields: ['chromStart', 'chromEnd'],
                    },
                    tracks: [
                        { mark: 'rect' },
                        {
                            mark: 'brush',
                            x: { linkingId: 'linear-scale' },
                            strokeWidth: { value: 1 },
                            stroke: { value: '#0070DC' },
                            color: { value: '#AFD8FF' },
                            opacity: { value: 0.5 },
                        },
                    ],
                    color: {
                        field: 'Stain',
                        type: 'nominal',
                        domain: [
                            'gneg',
                            'gpos25',
                            'gpos50',
                            'gpos75',
                            'gpos100',
                            'gvar',
                            'acen',
                        ],
                        range: [
                            'white',
                            'lightgray',
                            'gray',
                            'gray',
                            'black',
                            '#7B9CC8',
                            '#DC4542',
                        ],
                    },
                    size: { value: 18 },
                    x: { field: 'chromStart', type: 'genomic' },
                    xe: { field: 'chromEnd', type: 'genomic' },
                    strokeWidth: { value: 0 },
                    width,
                    height: 100,
                },
                {
                    id: 'circular-sv',
                    title: '',
                    alignment: 'overlay',
                    experimental: {
                        mouseEvents: {
                            click: true,
                            mouseOver: true,
                            groupMarksByField: 'sv_id',
                        },
                        performanceMode: true,
                    },
                    data: {
                        type: 'json',
                        values: this.props.data,
                        genomicFieldsToConvert: [
                            {
                                chromosomeField: 'chrom1',
                                genomicFields: ['start1', 'end1'],
                            },
                            {
                                chromosomeField: 'chrom2',
                                genomicFields: ['start2', 'end2'],
                            },
                        ],
                    },
                    mark: 'withinLink',
                    tracks: [
                        {
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'sv_id',
                                    oneOf: [
                                        this.props.selectedId ||
                                            '__no_selection__',
                                    ],
                                    not: true,
                                },
                            ],
                            x: { field: 'start1', type: 'genomic' },
                            xe: { field: 'end2', type: 'genomic' },
                            opacity: { value: 0.7 },
                            strokeWidth: { value: 1 },
                        },
                        {
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'sv_id',
                                    oneOf: [this.props.selectedId],
                                    not: false,
                                },
                            ],
                            x: { field: 'start1', type: 'genomic' },
                            xe: { field: 'end2', type: 'genomic' },
                            opacity: { value: 1 },
                            strokeWidth: { value: 3 },
                            stroke: { value: '#242424' },
                        },
                    ],
                    color: {
                        field: 'svclass',
                        type: 'nominal',
                        legend: false,
                        domain: SV_COLORS.domain,
                        range: SV_COLORS.range,
                    },
                    stroke: {
                        field: 'svclass',
                        type: 'nominal',
                        domain: SV_COLORS.domain,
                        range: SV_COLORS.range,
                    },
                    strokeWidth: { value: 1 },
                    opacity: { value: 0.7 },
                    tooltip: [
                        { field: 'sv_id', type: 'nominal', alt: 'SV ID' },
                        { field: 'svclass', type: 'nominal', alt: 'SV Type' },
                        { field: 'start1', type: 'genomic', alt: 'Position 1' },
                        { field: 'start2', type: 'genomic', alt: 'Position 2' },
                    ],
                    style: {
                        linkStyle: 'elliptical',
                        linkMinHeight: 0.7,
                        mouseOver: { stroke: '#242424', strokeWidth: 1 },
                        withinLinkVerticalLines: true,
                    },
                    width,
                    height: 80,
                },
            ],
        };
    }

    /**
     * Generate linear detail specification
     */
    private generateLinearDetailSpec(width: number) {
        const ideogramHeight = 18;
        const geneHeight = 60;
        const svHeight = this.props.height! - ideogramHeight - geneHeight - 20;

        return {
            linkingId: 'linear-scale',
            xDomain: this.props.xDomain
                ? {
                      chromosome: this.props.xDomain[0],
                      interval: [this.props.xDomain[1], this.props.xDomain[2]],
                  }
                : { chromosome: 'chr1' },
            layout: 'linear',
            arrangement: 'vertical',
            spacing: 5,
            views: [
                {
                    tracks: [
                        this.generateLinearIdeogramTrack(width, ideogramHeight),
                    ],
                },
                {
                    tracks: [this.generateGeneTrack(width, geneHeight)],
                },
                {
                    tracks: [this.generateLinearSVTrack(width, svHeight)],
                },
            ],
        };
    }

    /**
     * Generate linear ideogram track
     */
    private generateLinearIdeogramTrack(width: number, height: number) {
        return {
            id: 'linear-ideogram',
            title: '  Ideogram',
            alignment: 'overlay',
            data: {
                url:
                    this.props.assembly === 'hg38'
                        ? 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv'
                        : 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG19.Human.CytoBandIdeogram.csv',
                type: 'csv',
                chromosomeField: 'Chromosome',
                genomicFields: ['chromStart', 'chromEnd'],
            },
            tracks: [
                {
                    mark: 'rect',
                    dataTransform: [
                        {
                            type: 'filter',
                            field: 'Stain',
                            oneOf: ['acen'],
                            not: true,
                        },
                    ],
                },
                {
                    mark: 'triangleRight',
                    dataTransform: [
                        { type: 'filter', field: 'Stain', oneOf: ['acen'] },
                        { type: 'filter', field: 'Name', include: 'q' },
                    ],
                },
                {
                    mark: 'triangleLeft',
                    dataTransform: [
                        { type: 'filter', field: 'Stain', oneOf: ['acen'] },
                        { type: 'filter', field: 'Name', include: 'p' },
                    ],
                },
            ],
            color: {
                field: 'Stain',
                type: 'nominal',
                domain: [
                    'gneg',
                    'gpos25',
                    'gpos50',
                    'gpos75',
                    'gpos100',
                    'gvar',
                    'acen',
                ],
                range: [
                    'white',
                    'lightgray',
                    'gray',
                    'gray',
                    'black',
                    '#7B9CC8',
                    '#DC4542',
                ],
            },
            size: { value: 18 },
            x: { field: 'chromStart', type: 'genomic' },
            xe: { field: 'chromEnd', type: 'genomic' },
            strokeWidth: { value: 0 },
            width,
            height,
        };
    }

    /**
     * Generate gene annotation track
     */
    private generateGeneTrack(width: number, height: number) {
        return {
            id: 'linear-gene',
            title: '  Gene Annotation',
            template: 'gene',
            data: {
                url:
                    this.props.assembly === 'hg19'
                        ? 'https://server.gosling-lang.org/api/v1/tileset_info/?d=gene-annotation-hg19'
                        : 'https://server.gosling-lang.org/api/v1/tileset_info/?d=gene-annotation',
                type: 'beddb',
                genomicFields: [
                    { index: 1, name: 'start' },
                    { index: 2, name: 'end' },
                ],
                valueFields: [
                    { index: 5, name: 'strand', type: 'nominal' },
                    { index: 3, name: 'name', type: 'nominal' },
                ],
                exonIntervalFields: [
                    { index: 12, name: 'start' },
                    { index: 13, name: 'end' },
                ],
            },
            encoding: {
                startPosition: { field: 'start' },
                endPosition: { field: 'end' },
                strandColor: { field: 'strand', range: ['gray'] },
                strandRow: { field: 'strand' },
                opacity: { value: 0.4 },
                geneHeight: { value: 20 },
                geneLabel: { field: 'name' },
                geneLabelFontSize: { value: 20 },
                geneLabelColor: { field: 'strand', range: ['black'] },
                geneLabelStroke: { value: 'white' },
                geneLabelStrokeThickness: { value: 4 },
                geneLabelOpacity: { value: 1 },
                type: { field: 'type' },
            },
            tooltip: [
                { field: 'name', type: 'nominal' },
                { field: 'strand', type: 'nominal' },
            ],
            width,
            height,
        };
    }

    /**
     * Generate linear structural variant track
     */
    private generateLinearSVTrack(width: number, height: number) {
        const TRI_SIZE = 5;
        const baselineYMap: { [k: string]: { y: number; ye: number } } = {
            Translocation: { y: (height / 5) * 4, ye: height },
            Deletion: { y: height / 5, ye: 1 },
            Duplication: { y: height / 5, ye: (height / 5) * 2 },
            'Inversion (TtT)': { y: (height / 5) * 3, ye: (height / 5) * 2 },
            'Inversion (HtH)': { y: (height / 5) * 3, ye: (height / 5) * 4 },
        };

        const svTracks = [];

        for (const svType of SV_COLORS.domain) {
            const baseline = baselineYMap[svType];
            if (!baseline) continue;

            const { y, ye } = baseline;

            svTracks.push(
                {
                    dataTransform: [
                        {
                            type: 'filter',
                            field: 'sv_id',
                            oneOf: [this.props.selectedId],
                            not: true,
                        },
                        {
                            type: 'filter',
                            field: 'svclass',
                            oneOf: [svType],
                            not: false,
                        },
                    ],
                    x: { field: 'start1', type: 'genomic' },
                    xe: { field: 'end2', type: 'genomic' },
                    y: { value: y },
                    ye: { value: ye },
                    flipY: true,
                    opacity: { value: 0.7 },
                    strokeWidth: { value: 1 },
                },
                {
                    dataTransform: [
                        {
                            type: 'filter',
                            field: 'sv_id',
                            oneOf: [this.props.selectedId],
                            not: false,
                        },
                        {
                            type: 'filter',
                            field: 'svclass',
                            oneOf: [svType],
                            not: false,
                        },
                    ],
                    x: { field: 'start1', type: 'genomic' },
                    xe: { field: 'end2', type: 'genomic' },
                    y: { value: y },
                    ye: { value: ye },
                    flipY: true,
                    opacity: { value: 1 },
                    strokeWidth: { value: 2 },
                    ...(svType === 'Translocation'
                        ? { stroke: { value: 'grey' } }
                        : {}),
                }
            );
        }

        svTracks.push(
            {
                dataTransform: [
                    { type: 'filter', field: 'strand1', oneOf: ['+'] },
                ],
                mark: 'triangleLeft',
                x: { field: 'start1', type: 'genomic' },
                size: { value: TRI_SIZE },
                y: { value: height },
                stroke: { value: 0 },
                style: { align: 'right' },
            },
            {
                dataTransform: [
                    { type: 'filter', field: 'strand1', oneOf: ['-'] },
                ],
                mark: 'triangleRight',
                x: { field: 'start1', type: 'genomic' },
                size: { value: TRI_SIZE },
                y: { value: height },
                stroke: { value: 0 },
                style: { align: 'left' },
            },
            {
                dataTransform: [
                    { type: 'filter', field: 'strand2', oneOf: ['+'] },
                ],
                mark: 'triangleLeft',
                x: { field: 'end2', type: 'genomic' },
                size: { value: TRI_SIZE },
                y: { value: height },
                stroke: { value: 0 },
                style: { align: 'right' },
            },
            {
                dataTransform: [
                    { type: 'filter', field: 'strand2', oneOf: ['-'] },
                ],
                mark: 'triangleRight',
                x: { field: 'end2', type: 'genomic' },
                size: { value: TRI_SIZE },
                y: { value: height },
                stroke: { value: 0 },
                style: { align: 'left' },
            }
        );

        if (this.props.selectedId) {
            svTracks.push(
                {
                    dataTransform: [
                        {
                            type: 'filter',
                            field: 'sv_id',
                            oneOf: [this.props.selectedId],
                        },
                    ],
                    mark: 'rule',
                    x: { field: 'start1', type: 'genomic' },
                    color: { value: 'black' },
                    strokeWidth: { value: 1 },
                    opacity: { value: 1 },
                    style: { dashed: [3, 3] },
                },
                {
                    dataTransform: [
                        {
                            type: 'filter',
                            field: 'sv_id',
                            oneOf: [this.props.selectedId],
                        },
                    ],
                    mark: 'rule',
                    x: { field: 'end2', type: 'genomic' },
                    color: { value: 'black' },
                    strokeWidth: { value: 1 },
                    opacity: { value: 1 },
                    style: { dashed: [3, 3] },
                }
            );
        }

        return {
            id: 'linear-sv',
            title: '  Structural Variants',
            alignment: 'overlay',
            experimental: {
                mouseEvents: {
                    click: true,
                    mouseOver: true,
                    groupMarksByField: 'sv_id',
                },
                performanceMode: true,
            },
            data: {
                type: 'json',
                values: this.props.data,
                genomicFieldsToConvert: [
                    {
                        chromosomeField: 'chrom1',
                        genomicFields: ['start1', 'end1'],
                    },
                    {
                        chromosomeField: 'chrom2',
                        genomicFields: ['start2', 'end2'],
                    },
                ],
            },
            mark: 'withinLink',
            tracks: svTracks,
            y: { value: height / 5 },
            color: {
                field: 'svclass',
                type: 'nominal',
                legend: true,
                domain: SV_COLORS.domain,
                range: SV_COLORS.range,
            },
            stroke: {
                field: 'svclass',
                type: 'nominal',
                domain: SV_COLORS.domain,
                range: SV_COLORS.range,
            },
            strokeWidth: { value: 1 },
            opacity: { value: 0.7 },
            tooltip: [
                { field: 'start1', type: 'genomic' },
                { field: 'end2', type: 'genomic' },
                { field: 'strand1', type: 'nominal' },
                { field: 'strand2', type: 'nominal' },
                { field: 'svclass', type: 'nominal' },
                { field: 'sv_id', type: 'nominal' },
            ],
            style: {
                linkStyle: 'elliptical',
                linkMinHeight: 0.7,
                mouseOver: { stroke: '#242424', strokeWidth: 1 },
                withinLinkVerticalLines: true,
            },
            width,
            height,
        };
    }

    /**
     * Handle click events from Gosling visualization
     */
    private handleClick = (type: string, event: any) => {
        if (event.data && event.data.length > 0) {
            const clickedData = event.data[0];
            if (clickedData.sv_id && this.props.onClick) {
                this.props.onClick(clickedData.sv_id);
            }
        }
    };

    /**
     * Zoom to specific genomic region
     */
    public zoomTo(chromosome: string, start?: number, end?: number) {
        if (this.goslingRef.current?.api) {
            const region =
                start && end ? `${chromosome}:${start}-${end}` : chromosome;
            this.goslingRef.current.api.zoomTo(
                'linear-ideogram',
                region,
                0,
                500
            );
        }
    }

    /**
     * Zoom to show entire genome
     */
    public zoomToGenome() {
        if (this.goslingRef.current?.api) {
            this.goslingRef.current.api.zoomToExtent('linear-ideogram', 500);
        }
    }

    render() {
        if (this.props.isLoading) {
            return (
                <div
                    style={{
                        width: this.props.width,
                        height: this.props.height,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <LoadingIndicator
                        isLoading={true}
                        center={true}
                        size="big"
                    />
                </div>
            );
        }

        if (!this.goslingSpec) {
            return (
                <div
                    style={{
                        width: this.props.width,
                        height: this.props.height,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6c757d',
                        fontSize: '14px',
                    }}
                >
                    No data available for visualization
                </div>
            );
        }

        return (
            <div style={{ width: this.props.width, height: this.props.height }}>
                <GoslingComponent
                    ref={this.goslingRef}
                    spec={this.goslingSpec}
                    padding={3}
                    margin={0}
                    experimental={{ reactive: true }}
                    theme={THEME}
                />
            </div>
        );
    }
}
