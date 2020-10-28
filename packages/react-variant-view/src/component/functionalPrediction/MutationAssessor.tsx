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
    private static MUTATION_ASSESSOR_URL: string =
        'http://mutationassessor.org/r3/';

    private static mutationAssessorText() {
        return (
            <div style={{ width: 450, height: 110 }}>
                <a
                    href={MutationAssessor.MUTATION_ASSESSOR_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Mutation Assessor
                </a>{' '}
                predicts the functional impact of amino-acid substitutions in
                proteins, such as mutations discovered in cancer or missense
                polymorphisms. The functional impact is assessed based on
                evolutionary conservation of the affected amino acid in protein
                homologs. The method has been validated on a large set (60k) of
                disease associated (OMIM) and polymorphic variants.
            </div>
        );
    }

    private static mutationAssessorTooltipTable() {
        return (
            <div>
                <Table
                    table-border-top={true}
                    striped={true}
                    bordered={true}
                    hover={true}
                    sizes="sm"
                >
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

    // This is mostly to make the legacy MA links work
    private static maLink(link: string | undefined) {
        let url = null;

        // ignore invalid links ("", "NA", "Not Available")
        if (link) {
            // getma.org is the legacy link, need to replace it with the actual value
            url = link.replace('getma.org', 'mutationassessor.org/r3');

            // prepend "http://" if needed
            if (url.indexOf('http://') !== 0) {
                url = `http://${url}`;
            }
        }

        return url;
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
            this.props.mutationAssessor.functionalImpact != null &&
            this.props.mutationAssessor.functionalImpact !== ''
        ) {
            const maData = this.props.mutationAssessor;
            maContent = <span>{maData.functionalImpact}</span>;
        } else {
            maContent = <span>N/A</span>;
        }

        return (
            <div className={featureTableStyle['functional-group']}>
                <div className={featureTableStyle['data-source']}>
                    {this.mutationAssessorTooltip(
                        <a
                            href={MutationAssessor.MUTATION_ASSESSOR_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {dataSource}
                        </a>
                    )}
                </div>
                <div>
                    {this.mutationAssessorTooltip(
                        <span className={featureTableStyle['data-with-link']}>
                            <a
                                href={MutationAssessor.MUTATION_ASSESSOR_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {maContent}
                            </a>
                        </span>
                    )}
                </div>
            </div>
        );
    }

    private mutationAssessorData() {
        if (this.props.mutationAssessor) {
            const maData = this.props.mutationAssessor;
            const xVarLink = MutationAssessor.maLink(
                `http://mutationassessor.org/r3/?cm=var&p=${maData.uniprotId}&var=${maData.variant}`
            );
            const msaLink = MutationAssessor.maLink(maData.msaLink);
            const pdbLink = MutationAssessor.maLink(maData.pdbLink);
            const impact = maData.functionalImpact ? (
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
                    <span>
                        Please refer to the score range{' '}
                        <a
                            href="http://mutationassessor.org/r3/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            here
                        </a>
                        .
                    </span>
                </div>
            ) : null;

            const xVar =
                xVarLink &&
                maData.uniprotId.length !== 0 &&
                maData.variant.length !== 0 ? (
                    <div className={tooltipStyles['mutation-assessor-link']}>
                        <a
                            href={xVarLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <img
                                height="15"
                                width="19"
                                src={mutationAssessorLogo}
                                className={
                                    tooltipStyles['mutation-assessor-main-img']
                                }
                                alt="Mutation Assessor"
                            />
                            Go to Mutation Assessor
                        </a>
                    </div>
                ) : null;

            const msa =
                msaLink && maData.msaLink.length !== 0 ? (
                    <div className={tooltipStyles['mutation-assessor-link']}>
                        <a
                            href={msaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span
                                className={`${tooltipStyles['ma-icon']} ${tooltipStyles['ma-msa-icon']}`}
                            >
                                msa
                            </span>
                            Multiple Sequence Alignment
                        </a>
                    </div>
                ) : null;

            const pdb =
                pdbLink && maData.pdbLink.length !== 0 ? (
                    <div className={tooltipStyles['mutation-assessor-link']}>
                        <a
                            href={pdbLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span
                                className={`${tooltipStyles['ma-icon']} ${tooltipStyles['ma-3d-icon']}`}
                            >
                                3D
                            </span>
                            Mutation Assessor 3D View
                        </a>
                    </div>
                ) : null;

            return (
                <div>
                    {impact}
                    {msa}
                    {pdb}
                    {xVar}
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
