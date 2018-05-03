import * as React from "react";
import "./styles.scss";
import { ClinicalAttribute } from "shared/api/generated/CBioPortalAPI";
import { observable, computed, action } from "mobx";
import _ from "lodash";
import {If} from 'react-if';


export interface IChartHeaderProps {
    clinicalAttribute: ClinicalAttribute,
    showControls?:boolean
}

export class ChartHeader extends React.Component<IChartHeaderProps, {}> {

    public render() {
        return (
            <main>
                <section><span>{this.props.clinicalAttribute.displayName}</span></section>
                <aside>
                    <If condition={this.props.showControls}>
                        <div role="group" className="btn-group study-view-chart-buttons">
                            <button className="btn btn-xs">
                                <i className="fa fa-undo" aria-hidden="true" title="Reset filters in chart"></i>
                            </button>
                            <button className="btn btn-xs" >
                                <i className="fa fa-info-circle" aria-hidden="true" title={this.props.clinicalAttribute.description}></i>
                            </button>
                            <button className="btn btn-xs">
                                <i className="fa fa-table" aria-hidden="true" title="Convert pie chart to table"></i>
                            </button>
                            <button className="btn btn-xs">
                                <i className="fa fa-pie-chart" aria-hidden="true" title="Convert table to pie chart"></i>
                            </button>
                            <button className="btn btn-xs">
                                <i className="fa fa-line-chart" aria-hidden="true" title="Survival Analysis"></i>
                            </button>
                            <button className="btn btn-xs">
                                <i className="fa fa-download" aria-hidden="true" title="Download"></i>
                            </button>
                            <button className="btn btn-xs">
                                <i className="fa fa-arrows" aria-hidden="true" title="Move chart"></i>
                            </button>
                            <button className="btn btn-xs">
                                <i className="fa fa-times" aria-hidden="true" title="Delete chart"></i>
                            </button>
                        </div>
                    </If>
                </aside>
            </main>
        )
    }

}