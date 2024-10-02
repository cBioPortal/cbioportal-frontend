import { DefaultTooltip } from 'cbioportal-frontend-commons';
import classNames from 'classnames';
import { MutationAssessor as MutationAssessorData } from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Table } from 'react-bootstrap';

import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import functionalImpactColor from '../featureTable/FunctionalImpactTooltip.module.scss';
import tooltipStyles from './MutationAssessorTooltip.module.scss';
import mutationAssessorLogo from '../../image/mutationAssessor.png';

// Most of this component comes from cBioPortal-frontend

export interface IMutationAssessorProps {
    mutationAssessor: MutationAssessorData | undefined;
    isCanonicalTranscriptSelected: boolean;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'true';
}

@observer
export default class MutationAssessor extends React.Component<
    IMutationAssessorProps,
    {}
> {
    // Change to new url when available
    // New url will need to be added in tooltip, discrption, "Please refer to the score range here." and "Go to Mutation Assessor"
    // private static MUTATION_ASSESSOR_URL: string = 'http://mutationassessor.org/r3/';

    private static mutationAssessorText() {
        return (
            <div style={{ width: 450, height: 110 }}>
                Mutation Assessor predicts the functional impact of amino-acid
                substitutions in proteins, such as mutations discovered in
                cancer or missense polymorphisms. The functional impact is
                assessed based on evolutionary conservation of the affected
                amino acid in protein homologs. The method has been validated on
                a large set of disease associated and polymorphic variants
                (ClinVar).
            </div>
        );
    }

    private static mutationAssessorTooltipTable() {
        return (
            <div>
                <Table striped={true} bordered={true} hover={true} sizes="sm">
                    <thead>
                        <tr>
                            <th>Legend</th>
                            <th>
                                <span
                                    style={{ display: 'inline-block' }}
                                    title="Mutation Assessor"
                                >
                                    <img
                                        height={14}
                                        src={mutationAssessorLogo}
                                        alt="Mutation Assessor"
                                    />
                                    &nbsp;Qualitative prediction
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <span>
                                    <i
                                        className={classNames(
                                            functionalImpactColor.high,
                                            'fa fa-circle'
                                        )}
                                        aria-hidden="true"
                                    />
                                </span>
                            </td>
                            <td>
                                <b>High</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span>
                                    <i
                                        className={classNames(
                                            functionalImpactColor.medium,
                                            'fa fa-circle'
                                        )}
                                        aria-hidden="true"
                                    />
                                </span>
                            </td>
                            <td>
                                <b>Medium</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span>
                                    <i
                                        className={classNames(
                                            functionalImpactColor.low,
                                            'fa fa-circle'
                                        )}
                                        aria-hidden="true"
                                    />
                                </span>
                            </td>
                            <td>
                                <b>Low</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span>
                                    <i
                                        className={classNames(
                                            functionalImpactColor.neutral,
                                            'fa fa-circle'
                                        )}
                                        aria-hidden="true"
                                    />
                                </span>
                            </td>
                            <td>
                                <b>Neutral</b>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </div>
        );
    }

    constructor(props: IMutationAssessorProps) {
        super(props);

        this.mutationAssessorData = this.mutationAssessorData.bind(this);
    }

    public render() {
        let maContent: JSX.Element = <span />;
        const dataSource = (
            <>
                Mutation Assessor&nbsp;
                <i className="fas fa-external-link-alt" />
                {!this.props.isCanonicalTranscriptSelected && <span> *</span>}
            </>
        );

        if (
            this.props.mutationAssessor &&
            this.props.mutationAssessor.functionalImpactPrediction != null &&
            this.props.mutationAssessor.functionalImpactPrediction !== ''
        ) {
            const maData = this.props.mutationAssessor;
            maContent = <span>{maData.functionalImpactPrediction}</span>;
        } else {
            maContent = <span>N/A</span>;
        }

        return (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    {this.mutationAssessorTooltip(<>{dataSource}</>)}
                </div>
                <div>
                    {this.mutationAssessorTooltip(
                        <span className={featureTableStyle['data-with-link']}>
                            {maContent}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    private mutationAssessorData() {
        if (this.props.mutationAssessor) {
            const maData = this.props.mutationAssessor;
            const impact = maData.functionalImpactPrediction ? (
                <div>
                    <table className={tooltipStyles['ma-tooltip-table']}>
                        {(maData.functionalImpactScore ||
                            maData.functionalImpactScore === 0) && (
                            <tbody>
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
                            </tbody>
                        )}
                    </table>
                </div>
            ) : null;

            return (
                <div>
                    {impact}
                    <br />
                </div>
            );
        }
        return null;
    }

    private mutationAssessorTooltip(tooltipTrigger: JSX.Element) {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <div>
                        {MutationAssessor.mutationAssessorText()}
                        {this.mutationAssessorData()}
                        {MutationAssessor.mutationAssessorTooltipTable()}
                    </div>
                }
            >
                {tooltipTrigger}
            </DefaultTooltip>
        );
    }
}
