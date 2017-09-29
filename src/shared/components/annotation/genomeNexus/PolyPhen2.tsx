import * as React from "react";
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import annotationStyles from "./../styles/annotation.module.scss";
import classNames from 'classnames';
import tooltipStyles from "./styles/polyPhen2Tooltip.module.scss";

export interface IPolyPhen2Props {
    polyPhenPrediction: string; // benign, possibly_damaging, probably_damging
    polyPhenScore: number;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

export default class PolyPhen2 extends React.Component<IPolyPhen2Props, {}> {
    constructor(props: IPolyPhen2Props) {
        super(props);
        this.tooltipContent = this.tooltipContent.bind(this);
    }

    public render() {
        let content: JSX.Element = (
            <span className={`${annotationStyles["annotation-item-text"]}`}/>
        );

        if (this.props.polyPhenPrediction === null || this.props.polyPhenPrediction === undefined || this.props.polyPhenPrediction.length === 0) {
            //do not show any icon...
        } else {
            let text: string = this.props.polyPhenPrediction.split('_').length > 1? 
                this.props.polyPhenPrediction.split('_')[1].substring(0,1).toUpperCase() : 
                this.props.polyPhenPrediction.substring(0,1).toUpperCase();
            content = (
                <span className={classNames(annotationStyles["annotation-item-text"], tooltipStyles[`polyPhen2-${this.props.polyPhenPrediction}`])}>{text}</span>
            );
			const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
            content = (
                <DefaultTooltip
                    overlay={this.tooltipContent}
                    placement="right"
                    trigger={['hover', 'focus']}
                    arrowContent={arrowContent}
                    onPopupAlign={hideArrow}
                    destroyTooltipOnHide={false}
                >
                    {content}
                </DefaultTooltip>
			);
        }

        return content;
    }

    private tooltipContent() {
		const impact = this.props.polyPhenPrediction? (
			<div>
				<table className={tooltipStyles['polyPhen2-tooltip-table']}>
					<tr><td>Impact</td><td><span className={tooltipStyles[`polyPhen2-${this.props.polyPhenPrediction}`]}>{this.props.polyPhenPrediction}</span></td></tr>
					{this.props.polyPhenScore !== undefined && this.props.polyPhenScore !== null? <tr><td>Score</td><td><b>{this.props.polyPhenScore.toFixed(2)}</b></td></tr> : null}
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
