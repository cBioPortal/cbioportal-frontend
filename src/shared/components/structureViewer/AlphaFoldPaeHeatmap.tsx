import * as React from 'react';
import classnames from 'classnames';
import { getAlphaFoldPaeColor } from './AlphaFoldPaeUtils';
import styles from './structureViewer.module.scss';

export type PaeHeatmapHighlight = {
    rows: number[];
    cols: number[];
    /** When set, draw a box around this matrix cell (1-based row/col). */
    focusCell?: { row: number; col: number };
};

export interface AlphaFoldPaeHeatmapProps {
    matrix: number[][];
    maxPae: number;
    highlight?: PaeHeatmapHighlight;
    onCellClick?: (row: number, col: number) => void;
    className?: string;
}

export default class AlphaFoldPaeHeatmap extends React.Component<
    AlphaFoldPaeHeatmapProps,
    {}
> {
    private containerRef = React.createRef<HTMLDivElement>();
    private canvasRef = React.createRef<HTMLCanvasElement>();
    private resizeObserver: ResizeObserver | null = null;

    public componentDidMount() {
        this.attachResizeObserver();
        this.drawHeatmap();
    }

    public componentDidUpdate(prevProps: AlphaFoldPaeHeatmapProps) {
        if (
            prevProps.matrix !== this.props.matrix ||
            prevProps.maxPae !== this.props.maxPae ||
            prevProps.highlight !== this.props.highlight
        ) {
            this.drawHeatmap();
        }
    }

    public componentWillUnmount() {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }

    private attachResizeObserver() {
        const container = this.containerRef.current;

        if (!container || typeof ResizeObserver === 'undefined') {
            return;
        }

        this.resizeObserver = new ResizeObserver(() => {
            this.drawHeatmap();
        });
        this.resizeObserver.observe(container);
    }

    private getDisplaySize(): number {
        const container = this.containerRef.current;

        if (!container) {
            return 1;
        }

        const width = container.clientWidth;
        const height = container.clientHeight;
        const size = Math.min(width, height);

        return Math.max(1, Math.floor(size));
    }

    private drawHeatmap() {
        const canvas = this.canvasRef.current;
        const { matrix, maxPae, highlight } = this.props;

        if (!canvas || matrix.length === 0) {
            return;
        }

        const length = matrix.length;
        const size = this.getDisplaySize();
        const dpr = window.devicePixelRatio || 1;
        const pixelSize = Math.max(1, Math.floor(size * dpr));

        canvas.width = pixelSize;
        canvas.height = pixelSize;

        const context = canvas.getContext('2d');

        if (!context) {
            return;
        }

        context.setTransform(1, 0, 0, 1, 0, 0);
        const image = context.createImageData(pixelSize, pixelSize);
        const pixels = image.data;

        for (let y = 0; y < pixelSize; y++) {
            const rowIndex = Math.min(
                length - 1,
                Math.floor((y / pixelSize) * length)
            );
            const row = matrix[rowIndex];

            for (let x = 0; x < pixelSize; x++) {
                const colIndex = Math.min(
                    length - 1,
                    Math.floor((x / pixelSize) * length)
                );
                const value = row[colIndex];
                const { r, g, b } = getAlphaFoldPaeColor(value, maxPae);
                const offset = (y * pixelSize + x) * 4;

                pixels[offset] = r;
                pixels[offset + 1] = g;
                pixels[offset + 2] = b;
                pixels[offset + 3] = 255;
            }
        }

        context.putImageData(image, 0, 0);

        if (highlight) {
            highlight.rows.forEach(row =>
                this.drawHorizontalLine(context, row, length, pixelSize, dpr)
            );
            highlight.cols.forEach(col =>
                this.drawVerticalLine(context, col, length, pixelSize, dpr)
            );

            if (highlight.focusCell) {
                this.drawFocusCell(
                    context,
                    highlight.focusCell.row,
                    highlight.focusCell.col,
                    length,
                    pixelSize,
                    dpr
                );
            }
        }
    }

    private drawHorizontalLine(
        context: CanvasRenderingContext2D,
        row: number,
        length: number,
        pixelSize: number,
        dpr: number
    ) {
        const index = row - 1;

        if (index < 0 || index >= length) {
            return;
        }

        const center = ((index + 0.5) / length) * pixelSize;
        const outerWidth = Math.max(1, Math.round(2 * dpr));
        const innerWidth = Math.max(1, Math.round(1 * dpr));

        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        context.lineWidth = outerWidth;
        context.beginPath();
        context.moveTo(0, center);
        context.lineTo(pixelSize, center);
        context.stroke();

        context.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        context.lineWidth = innerWidth;
        context.beginPath();
        context.moveTo(0, center);
        context.lineTo(pixelSize, center);
        context.stroke();
        context.restore();
    }

    private drawVerticalLine(
        context: CanvasRenderingContext2D,
        col: number,
        length: number,
        pixelSize: number,
        dpr: number
    ) {
        const index = col - 1;

        if (index < 0 || index >= length) {
            return;
        }

        const center = ((index + 0.5) / length) * pixelSize;
        const outerWidth = Math.max(1, Math.round(2 * dpr));
        const innerWidth = Math.max(1, Math.round(1 * dpr));

        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        context.lineWidth = outerWidth;
        context.beginPath();
        context.moveTo(center, 0);
        context.lineTo(center, pixelSize);
        context.stroke();

        context.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        context.lineWidth = innerWidth;
        context.beginPath();
        context.moveTo(center, 0);
        context.lineTo(center, pixelSize);
        context.stroke();
        context.restore();
    }

    private drawFocusCell(
        context: CanvasRenderingContext2D,
        row: number,
        col: number,
        length: number,
        pixelSize: number,
        dpr: number
    ) {
        const rowIndex = row - 1;
        const colIndex = col - 1;

        if (
            rowIndex < 0 ||
            colIndex < 0 ||
            rowIndex >= length ||
            colIndex >= length
        ) {
            return;
        }

        const cellSize = pixelSize / length;
        const x = colIndex * cellSize;
        const y = rowIndex * cellSize;
        const lineWidth = Math.max(1, Math.round(2 * dpr));

        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        context.lineWidth = lineWidth;
        context.strokeRect(x, y, cellSize, cellSize);
        context.restore();
    }

    private handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const { matrix, onCellClick } = this.props;
        const canvas = this.canvasRef.current;

        if (!canvas || !onCellClick || matrix.length === 0) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const length = matrix.length;
        const row = Math.min(
            length,
            Math.max(1, Math.floor((y / rect.height) * length) + 1)
        );
        const col = Math.min(
            length,
            Math.max(1, Math.floor((x / rect.width) * length) + 1)
        );

        onCellClick(row, col);
        event.stopPropagation();
        event.preventDefault();
    };

    public render() {
        const { className, onCellClick } = this.props;

        return (
            <div ref={this.containerRef} className={styles['pae-heatmap-wrap']}>
                <canvas
                    ref={this.canvasRef}
                    className={classnames(
                        styles['pae-heatmap-canvas'],
                        className,
                        {
                            [styles['pae-heatmap-canvas--interactive']]:
                                !!onCellClick,
                        }
                    )}
                    onClick={this.handleCanvasClick}
                    aria-label="AlphaFold predicted aligned error heatmap"
                />
            </div>
        );
    }
}
