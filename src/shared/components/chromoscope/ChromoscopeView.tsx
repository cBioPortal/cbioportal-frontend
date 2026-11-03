/**
 * Unified Chromoscope visualization component
 * Displays circular genome overview and linear variant detail view in a single Gosling instance
 * Based on Chromoscope's architecture for proper brush linking functionality
 */
import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import { GoslingComponent, GoslingRef, GoslingSpec } from 'gosling.js';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    ChromoscopeAssembly,
    GenomeVisualizationSV,
    SV_CLASS,
    SvClass,
} from 'shared/lib/goslingTransforms/goslingStructuralVariantTransform';

interface IChromoscopeViewProps {
    /**
     * Structural variant data in Gosling-compatible format
     */
    data: GenomeVisualizationSV[];
    assembly: ChromoscopeAssembly;
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

const GOSLING_PADDING = 3;
const CIRCULAR_MAX_WIDTH = 400;
const VIEW_SPACING = 20;
const SV_ROW_HEIGHT = 50;

export const SV_COLORS: { domain: SvClass[]; range: string[] } = {
    domain: [
        SV_CLASS.TRANSLOCATION,
        SV_CLASS.DUPLICATION,
        SV_CLASS.DELETION,
        SV_CLASS.INVERSION_TTT,
        SV_CLASS.INVERSION_HTH,
        SV_CLASS.OTHER,
    ],
    range: ['lightgrey', '#409F7A', '#3275B4', '#CC7DAA', '#E6A01B', '#8C6D46'],
};

const CYTOBAND_URL: { [assembly in ChromoscopeAssembly]: string } = {
    hg19:
        'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG19.Human.CytoBandIdeogram.csv',
    hg38:
        'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
};

const GENE_ANNOTATION_URL: { [assembly in ChromoscopeAssembly]: string } = {
    hg19:
        'https://server.gosling-lang.org/api/v1/tileset_info/?d=gene-annotation-hg19',
    hg38:
        'https://server.gosling-lang.org/api/v1/tileset_info/?d=gene-annotation',
};

const SV_TOOLTIP = [
    { field: 'sampleId', type: 'nominal', alt: 'Sample' },
    { field: 'gene1', type: 'nominal', alt: 'Gene 1' },
    { field: 'start1', type: 'genomic', alt: 'Breakpoint 1' },
    { field: 'gene2', type: 'nominal', alt: 'Gene 2' },
    { field: 'start2', type: 'genomic', alt: 'Breakpoint 2' },
    { field: 'svclass', type: 'nominal', alt: 'Shown as' },
    { field: 'originalClass', type: 'nominal', alt: 'Class' },
    { field: 'connectionType', type: 'nominal', alt: 'Connection type' },
];

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
    @observable private containerWidth = 0;

    private goslingRef = React.createRef<GoslingRef>();
    private containerRef = React.createRef<HTMLDivElement>();
    private resizeObserver: ResizeObserver | undefined;

    public static defaultProps: Partial<IChromoscopeViewProps> = {
        isLoading: false,
    };

    constructor(props: IChromoscopeViewProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        this.setupEventListeners();
        this.isInitialized = true;
        if (this.containerRef.current) {
            this.resizeObserver = new ResizeObserver(entries => {
                this.setContainerWidth(entries[0].contentRect.width);
            });
            this.resizeObserver.observe(this.containerRef.current);
        }
    }

    componentWillUnmount() {
        this.cleanupEventListeners();
        this.resizeObserver?.disconnect();
    }

    @action.bound
    private setContainerWidth(width: number) {
        this.containerWidth = Math.floor(width);
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

        // gosling adds `padding` on each side of the spec width
        const width = this.containerWidth - GOSLING_PADDING * 2;
        if (width <= 0) {
            return null;
        }
        const circularWidth = Math.min(width, CIRCULAR_MAX_WIDTH);
        const linearWidth = width - circularWidth - VIEW_SPACING;

        return {
            assembly: this.props.assembly,
            arrangement: 'horizontal',
            spacing: VIEW_SPACING,
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
                        url: CYTOBAND_URL[this.props.assembly],
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
                    mouseEvents: {
                        click: true,
                        mouseOver: true,
                        groupMarksByField: 'sv_id',
                    },
                    experimental: {
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
                    tooltip: SV_TOOLTIP,
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
        return {
            linkingId: 'linear-scale',
            xDomain: this.props.xDomain
                ? {
                      chromosome: this.props.xDomain[0],
                      interval: [this.props.xDomain[1], this.props.xDomain[2]],
                  }
                : { chromosome: 'chr1' },
            layout: 'linear',
            tracks: [
                this.generateLinearIdeogramTrack(width, 18),
                this.generateGeneTrack(width, 60),
                this.generateLinearSVTrack(
                    width,
                    SV_ROW_HEIGHT * SV_COLORS.domain.length
                ),
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
                url: CYTOBAND_URL[this.props.assembly],
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
                url: GENE_ANNOTATION_URL[this.props.assembly],
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
        const row = height / 6;
        // each pair of classes shares a baseline, drawn above and below it
        const baselineYMap: { [k in SvClass]: { y: number; ye: number } } = {
            [SV_CLASS.DELETION]: { y: row, ye: 1 },
            [SV_CLASS.DUPLICATION]: { y: row, ye: row * 2 },
            [SV_CLASS.INVERSION_TTT]: { y: row * 3, ye: row * 2 },
            [SV_CLASS.INVERSION_HTH]: { y: row * 3, ye: row * 4 },
            [SV_CLASS.OTHER]: { y: row * 5, ye: row * 4 },
            [SV_CLASS.TRANSLOCATION]: { y: row * 5, ye: height },
        };

        const svTracks = [];

        for (const svType of SV_COLORS.domain) {
            const { y, ye } = baselineYMap[svType];

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
            mouseEvents: {
                click: true,
                mouseOver: true,
                groupMarksByField: 'sv_id',
            },
            experimental: {
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
            y: { value: row },
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
            tooltip: SV_TOOLTIP,
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

    private renderContent() {
        const messageStyle: React.CSSProperties = {
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d',
            fontSize: '14px',
        };

        if (this.props.isLoading) {
            return (
                <div style={messageStyle}>
                    <LoadingIndicator
                        isLoading={true}
                        center={true}
                        size="big"
                    />
                </div>
            );
        }

        if (!this.props.data || this.props.data.length === 0) {
            return (
                <div style={messageStyle}>
                    No data available for visualization
                </div>
            );
        }

        if (!this.goslingSpec) {
            return null;
        }

        return (
            <GoslingComponent
                ref={this.goslingRef}
                spec={this.goslingSpec}
                padding={GOSLING_PADDING}
                margin={0}
                reactive={true}
                theme={THEME}
            />
        );
    }

    render() {
        return (
            <div ref={this.containerRef} style={{ width: '100%' }}>
                {this.renderContent()}
            </div>
        );
    }
}
