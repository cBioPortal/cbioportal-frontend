import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import {
    IStructureVisualizerProps,
    IResidueSpec,
    StructureSource,
    StructureLoadStatus,
} from './StructureVisualizer';
import StructureVisualizer3D from './StructureVisualizer3D';

export interface IStructureViewerProps extends IStructureVisualizerProps {
    structureSource: StructureSource;
    pdbId: string;
    uniprotId?: string;
    chainId: string;
    bounds: { width: number | string; height: number | string };
    residues?: IResidueSpec[];
    containerRef?: (div: HTMLDivElement) => void;
    onStructureLoadStatusChange?: (
        status: StructureLoadStatus,
        message?: string
    ) => void;
}

@observer
export default class StructureViewer extends React.Component<
    IStructureViewerProps,
    {}
> {
    private _3dMolDiv: HTMLDivElement | undefined;
    private _structureSource: StructureSource;
    private _structureId: string;
    private wrapper: StructureVisualizer3D;

    public constructor(props: IStructureViewerProps) {
        super(props);

        this.divHandler = this.divHandler.bind(this);
    }

    public render() {
        return (
            <div
                ref={this.divHandler}
                style={{
                    height: this.props.bounds.height,
                    width: this.props.bounds.width,
                    padding: 0,
                }}
                className="borderedChart"
            />
        );
    }

    public componentDidMount() {
        if (this._3dMolDiv) {
            this.wrapper = new StructureVisualizer3D(
                this._3dMolDiv,
                this.props
            );
            this._structureSource = this.props.structureSource;
            this._structureId = this.getStructureId();
            this.wrapper.init(
                this._structureId,
                this.props.chainId,
                this.props.residues,
                this.props.structureSource
            );
        }
    }

    public componentDidUpdate(prevProps: IStructureViewerProps) {
        if (this.wrapper) {
            const structureId = this.getStructureId();
            const needsReload =
                structureId !== this._structureId ||
                this.props.structureSource !== this._structureSource ||
                this.props.chainId !== prevProps.chainId ||
                (this.props.structureSource === StructureSource.ALPHAFOLD &&
                    this.props.alphafoldIsoform !== prevProps.alphafoldIsoform);

            if (needsReload) {
                this._structureId = structureId;
                this._structureSource = this.props.structureSource;
                this.wrapper.loadStructure(
                    this.props.structureSource,
                    structureId,
                    this.props.chainId,
                    this.props.residues,
                    this.props
                );
            } else {
                this.wrapper.updateViewer(
                    this.props.chainId,
                    this.props.residues,
                    this.props
                );
            }

            if (!_.isEqual(this.props.bounds, prevProps.bounds)) {
                this.wrapper.resize();
            }
        }
    }

    private getStructureId(): string {
        if (this.props.structureSource === StructureSource.ALPHAFOLD) {
            return (this.props.uniprotId || '').toUpperCase();
        }

        return this.props.pdbId.toUpperCase();
    }

    private divHandler(div: HTMLDivElement) {
        this._3dMolDiv = div;

        if (this.props.containerRef) {
            this.props.containerRef(div);
        }
    }
}
