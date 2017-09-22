import * as React from "react";
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import annotationStyles from "./../styles/annotation.module.scss";
import classNames from 'classnames';
import tooltipStyles from "./styles/siftTooltip.module.scss";

export interface ISiftProps {
    siftPrediction: string; // deleterious, deleterious_low_confidence, tolerated, tolerated_low_confidence
    siftScore: number;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

export default class Sift extends React.Component<ISiftProps, {}> {
    constructor(props: ISiftProps) {
        super(props);
        this.tooltipContent = this.tooltipContent.bind(this);
    }

    public render() {
        let siftContent: JSX.Element = (
            <span className={`${annotationStyles["annotation-item-text"]}`}/>
        );

        if (this.props.siftPrediction === null || this.props.siftPrediction === undefined || this.props.siftPrediction.length === 0) {
            //do not show any icon...
        } else {
            siftContent = (
                <span className={classNames(annotationStyles["annotation-item-text"], tooltipStyles[`sift-${this.props.siftPrediction}`])}>{this.props.siftPrediction.substring(0,1).toUpperCase()}</span>
            );
			const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
            siftContent = (
                <DefaultTooltip
                    overlay={this.tooltipContent}
                    placement="right"
                    trigger={['hover', 'focus']}
                    arrowContent={arrowContent}
                    onPopupAlign={hideArrow}
                    destroyTooltipOnHide={false}
                >
                    {siftContent}
                </DefaultTooltip>
			);
        }

        return siftContent;
    }

    private tooltipContent() {
		const impact = this.props.siftPrediction? (
			<div>
				<table className={tooltipStyles['sift-tooltip-table']}>
					<tr><td>Impact</td><td><span className={tooltipStyles[`sift-${this.props.siftPrediction}`]}>{this.props.siftPrediction}</span></td></tr>
					{this.props.siftScore !== undefined && this.props.siftScore !== null? <tr><td>Score</td><td><b>{this.props.siftScore.toFixed(2)}</b></td></tr> : null}
				</table>
			</div>
		) : null;

        return (
            <span>
                {impact}
            </span>
        );
    }
}
