import * as React from "react";
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import annotationStyles from "./../styles/annotation.module.scss";
import tooltipStyles from "./styles/siftTooltip.module.scss";
import siftIconStyles from "./styles/siftIcon.module.scss";

export interface ISiftProps {
    siftPrediction: string; // deleterious, deleterious_low_confidence, tolerated, tolerated_low_confidence
    siftScore: number;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

export default class Sift extends React.Component<ISiftProps, {}> {
    public static get SIFT_ICON_STYLE() {
        return {
            backgroundImage: `url(${require('./images/sift-icons.png')})`
        };
    }

    constructor(props: ISiftProps) {
        super(props);
        this.tooltipContent = this.tooltipContent.bind(this);
    }

    public render() {
        let siftContent: JSX.Element = (
            <span className={`${annotationStyles["annotation-item"]}`}/>
        );

        if (this.props.siftPrediction === null || this.props.siftPrediction === undefined || this.props.siftPrediction.length === 0) {
            //do not show any icon...
        } else {
            siftContent = (
                <span className={`${annotationStyles["annotation-item"]}`}>
                    <i
                        className={`${siftIconStyles['sift-icon-image']} ${this.props.siftPrediction? siftIconStyles[this.props.siftPrediction] : ''}`}
                        style={Sift.SIFT_ICON_STYLE}
                        data-test='sift-icon-image'
                    />
                </span>
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
