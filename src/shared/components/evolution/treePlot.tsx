import * as React from "react";
import {computed} from "mobx";
import {observer} from "mobx-react";
const demoSvg = require("./demo.svg") as string;

export interface TreeNodeProps {
    nodeMutationClusterId: String
}

function selectMutationClusterInMutationTable(props:any) {
    props
}

export class TreeNode extends React.Component<TreeNodeProps> {
    constructor(props:TreeNodeProps) {
        super(props);
    }

    clusterSelected = 1;
    render() {
        return(
            <button onClick={selectMutationClusterInMutationTable}>Cluster{this.props.nodeMutationClusterId}</button>
        )
    }
}

export default class TreePlot extends React.Component<any, any> {

    render() {
        return(
            <div className="treePlot">
                <div className="demoTree">
                    <img src={demoSvg}></img>
                </div>

                <div className="devButton">
                    <TreeNode nodeMutationClusterId = {1} />
                    <TreeNode nodeMutationClusterId = {2} />
                    <TreeNode nodeMutationClusterId = {3} />
                    <TreeNode nodeMutationClusterId = {4} />
                </div>
            </div>
        )
    }
}
