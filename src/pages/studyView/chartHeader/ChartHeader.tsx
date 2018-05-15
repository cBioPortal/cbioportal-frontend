import * as React from "react";
import "./styles.scss";
import {ClinicalAttribute} from "shared/api/generated/CBioPortalAPI";
import {If} from 'react-if';

export interface IChartHeaderProps {
    clinicalAttribute: ClinicalAttribute;
    showControls: boolean;
    showResetIcon?: boolean;
    handleResetClick: () => void;
}

export class ChartHeader extends React.Component<IChartHeaderProps, {}> {
    constructor(props: IChartHeaderProps) {
        super(props);
    }

    public render() {
        return (
            <div className='studyViewPageChartHeader'>
                <div className='name'><span>{this.props.clinicalAttribute.displayName}</span></div>
                <div className='controls'>
                    <If condition={this.props.showControls}>
                        <div role="group" className="btn-group">
                            <If condition={!!this.props.showResetIcon}>
                                <button className="btn btn-xs" onClick={() => this.props.handleResetClick()}>
                                    <i className="fa fa-undo" aria-hidden="true" title="Reset filters in chart"></i>
                                </button>
                            </If>
                            <button className="btn btn-xs">
                                <i className="fa fa-info-circle" aria-hidden="true"
                                   title={this.props.clinicalAttribute.description}></i>
                            </button>
                        </div>
                    </If>
                </div>
            </div>
        )
    }

}