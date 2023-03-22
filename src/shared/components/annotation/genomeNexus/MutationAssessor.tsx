import * as React from 'react';
import annotationStyles from './../styles/annotation.module.scss';
import classNames from 'classnames';
import tooltipStyles from './styles/mutationAssessorTooltip.module.scss';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { MutationAssessor as MutationAssessorData } from 'genome-nexus-ts-api-client';
import mutationAssessorColumn from './styles/mutationAssessorColumn.module.scss';

export interface IMutationAssessorProps {
    mutationAssessor: MutationAssessorData | undefined;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

export default class MutationAssessor extends React.Component<
    IMutationAssessorProps,
    {}
> {
    static MUTATION_ASSESSOR_URL: string = 'http://mutationassessor.org/r3/';

    constructor(props: IMutationAssessorProps) {
        super(props);

        this.tooltipContent = this.tooltipContent.bind(this);
    }

    public static download(
        mutationAssessorData: MutationAssessorData | undefined
    ): string {
        if (mutationAssessorData) {
            return `impact: ${mutationAssessorData.functionalImpact}, score: ${mutationAssessorData.functionalImpactScore}`;
        } else {
            return 'NA';
        }
    }

    public render() {
        let maContent: JSX.Element = (
            <span className={`${annotationStyles['annotation-item-text']}`} />
        );

        if (
            this.props.mutationAssessor &&
            this.props.mutationAssessor.functionalImpact !== null
        ) {
            const maData = this.props.mutationAssessor;
            maContent = (
                <span
                    className={classNames(
                        annotationStyles['annotation-item-text'],
                        (mutationAssessorColumn as any)[
                            `ma-${maData.functionalImpact}`
                        ]
                    )}
                >
                    <i className="fa fa-circle" aria-hidden="true"></i>
                </span>
            );
            const arrowContent = <div className="rc-tooltip-arrow-inner" />;
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
        if (this.props.mutationAssessor) {
            const maData = this.props.mutationAssessor;
            const impact = maData.functionalImpact ? (
                <div>
                    <table className={tooltipStyles['ma-tooltip-table']}>
                        <tr>
                            <td>Source</td>
                            <td>
                                <a href="http://mutationassessor.org/r3">
                                    MutationAssessor
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td>Impact</td>
                            <td>
                                <span
                                    className={
                                        (mutationAssessorColumn as any)[
                                            `ma-${maData.functionalImpact}`
                                        ]
                                    }
                                >
                                    {maData.functionalImpact}
                                </span>
                            </td>
                        </tr>
                        {(maData.functionalImpactScore ||
                            maData.functionalImpactScore === 0) && (
                            <tr>
                                <td>Score</td>
                                <td>
                                    <b>
                                        {maData.functionalImpactScore.toFixed(
                                            2
                                        )}
                                    </b>
                                </td>
                            </tr>
                        )}
                    </table>
                </div>
            ) : null;

            return impact;
        }
    }
}
