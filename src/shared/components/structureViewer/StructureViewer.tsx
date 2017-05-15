import * as React from 'react';
import {observer} from "mobx-react";
import {observable} from "mobx";
import {
    IStructureVisualizerProps, default as StructureVisualizerWrapper, IResidueSpec
} from "./StructureVisualizerWrapper";

export interface IStructureViewerProps extends IStructureVisualizerProps {
    pdbId: string;
    chainId: string;
    residues?: IResidueSpec[];
}

@observer
export default class StructureViewer extends React.Component<IStructureViewerProps, {}>
{
    private _3dMolDiv:HTMLDivElement|undefined;
    private _pdbId: string;
    private wrapper:StructureVisualizerWrapper;

    public constructor() {
        super();

        this.divHandler = this.divHandler.bind(this);
    }

    public render()
    {
        return (
            <div
                ref={this.divHandler}
                style={{height: "300px"}}
            />
        );
    }

    public componentDidMount() {
        if (this._3dMolDiv) {
            this.wrapper = new StructureVisualizerWrapper(this._3dMolDiv, this.props);
            this.wrapper.init(this.props.pdbId, this.props.chainId, this.props.residues);
            this._pdbId = this.props.pdbId;
        }
    }

    public componentDidUpdate() {
        if (this.wrapper) {
            // if pdbId is updated we need to reload the structure
            if (this.props.pdbId !== this._pdbId) {
                this._pdbId = this.props.pdbId;
                this.wrapper.loadPdb(this._pdbId, this.props.chainId, this.props.residues, this.props);
            }
            // other updates just require selection/style updates without reloading the structure
            else {
                this.wrapper.updateViewer(this.props.chainId, this.props.residues, this.props);
            }
        }
    }

    private divHandler(div:HTMLDivElement) {
         this._3dMolDiv = div;
    }
}
