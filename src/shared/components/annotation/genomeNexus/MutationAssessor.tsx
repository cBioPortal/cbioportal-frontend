import * as React from "react";
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import annotationStyles from "./../styles/annotation.module.scss";
import tooltipStyles from "./styles/mutationAssessorTooltip.module.scss";
import mutationAssessorIconStyles from "./styles/mutationAssessorIcon.module.scss";
import {GenomeNexusCacheDataType} from "shared/cache/GenomeNexusEnrichment";
import {MutationAssessor as MutationAssessorData} from 'shared/api/generated/GenomeNexusAPI';

export interface IMutationAssessorProps {
    mutationAssessor: MutationAssessorData;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

export default class MutationAssessor extends React.Component<IMutationAssessorProps, {}> {
    public static get MUTATION_ASSESSOR_ICON_STYLE() {
        return {
            backgroundImage: `url(${require('./images/mutationassessor-icons.png')})`
        };
    }

    constructor(props: IMutationAssessorProps) {
        super(props);

        this.tooltipContent = this.tooltipContent.bind(this);
    }

    public render() {
        let maContent: JSX.Element = (
            <span className={`${annotationStyles["annotation-item"]}`}/>
        );

        if (this.props.mutationAssessor.functionalImpact === null) {
            //do not show any icon...
        } else {
            maContent = (
                <span className={`${annotationStyles["annotation-item"]}`}>
                    <i
                        className={`${mutationAssessorIconStyles['mutationassessor-icon-image']} ${mutationAssessorIconStyles[this.props.mutationAssessor.functionalImpact]}`}
                        style={MutationAssessor.MUTATION_ASSESSOR_ICON_STYLE}
                        data-test='mutationassessor-icon-image'
                    />
                </span>
            );
			const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
            maContent = (
                <DefaultTooltip
                    overlay={this.tooltipContent}
                    placement="right"
                    trigger={['hover', 'focus']}
                    arrowContent={arrowContent}
                    onPopupAlign={hideArrow}
                    destroyTooltipOnHide={false}
                >
                    {maContent}
                </DefaultTooltip>
			);
        }

        return maContent;
    }

    private tooltipContent() {
        const maData = this.props.mutationAssessor;
        const xVarLink = MutationAssessor.maLink(`http://mutationassessor.org/r3/?cm=var&var=${maData.input}`);
        const msaLink = MutationAssessor.maLink(maData.msaLink);
        const pdbLink = MutationAssessor.maLink(maData.pdbLink);

		const impact = maData.functionalImpact? (
			<div>
				<table className={tooltipStyles['ma-tooltip-table']}>
					<tr><td>Impact</td><td><span className={tooltipStyles[`ma-${maData.functionalImpact}`]}>{maData.functionalImpact}</span></td></tr>
					{maData.functionalImpactScore? <tr><td>Score</td><td><b>{maData.functionalImpactScore.toFixed(2)}</b></td></tr> : null}
				</table>
			</div>
		) : null;

        const xVar = xVarLink? (
			<div className={tooltipStyles['mutation-assessor-link']}>
				<a href={xVarLink} target='_blank'>
					<img
						height='15'
						width='19'
						src={require("./../../mutationTable/column/mutationAssessor.png")}
						className={tooltipStyles['mutation-assessor-main-img']}
						alt='Mutation Assessor'
					/>
					Go to Mutation Assessor
				</a>
			</div>
		) : null;

        const msa = msaLink? (
			<div className={tooltipStyles['mutation-assessor-link']}>
				<a href={msaLink} target='_blank'>
					<span className={`${tooltipStyles['ma-icon']} ${tooltipStyles['ma-msa-icon']}`}>msa</span>
					Multiple Sequence Alignment
				</a>
			</div>
		) : null;

        const pdb = pdbLink? (
			<div className={tooltipStyles['mutation-assessor-link']}>
				<a href={pdbLink} target='_blank'>
					<span className={`${tooltipStyles['ma-icon']} ${tooltipStyles['ma-3d-icon']}`}>3D</span>
					Mutation Assessor 3D View
				</a>
			</div>
		) : null;

        return (
            <span>
                {impact}
                {msa}
                {pdb}
                {xVar}
            </span>
        );
    }

    // This is mostly to make the legacy MA links work
    public static maLink(link:string|undefined)
    {
        let url = null;

        // ignore invalid links ("", "NA", "Not Available")
        if (link)
        {
            // getma.org is the legacy link, need to replace it with the actual value
            url = link.replace("getma.org", "mutationassessor.org/r3");

            // prepend "http://" if needed
            if (url.indexOf("http://") !== 0)
            {
                url = `http://${url}`;
            }
        }

        return url;
    }
}
