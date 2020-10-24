import { observer } from 'mobx-react';
import * as React from 'react';

import { IndicatorQueryResp } from 'oncokb-ts-api-client';

import {
    MyVariantInfo,
    VariantAnnotation,
    VariantAnnotationSummary,
} from 'genome-nexus-ts-api-client';
import BiologicalFunction from '../biologicalFunction/BiologicalFunction';
import featureTableStyle from './FeatureTable.module.scss';
import FunctionalPrediction from '../functionalPrediction/FunctionalPrediction';
import PopulationPrevalence from '../populationPrevalence/PopulationPrevalence';
import TherapeuticImplication from '../therapeuticImplication/TherapeuticImplication';

interface IFeatureTableProps {
    annotationInternal?: VariantAnnotationSummary;
    myVariantInfo?: MyVariantInfo;
    variantAnnotation?: VariantAnnotation;
    oncokb?: IndicatorQueryResp;
    isCanonicalTranscriptSelected: boolean;
}

@observer
class FeatureTable extends React.Component<IFeatureTableProps> {
    public render() {
        return (
            <div className={featureTableStyle['feature-table']}>
                <table className={'table'}>
                    <tr>
                        <th>Therapeutic implication:</th>
                        <td>
                            <TherapeuticImplication
                                oncokb={this.props.oncokb}
                                isCanonicalTranscriptSelected={
                                    this.props.isCanonicalTranscriptSelected
                                }
                            />
                        </td>
                    </tr>

                    <tr>
                        <th>Biological function:</th>
                        <td>
                            <BiologicalFunction
                                oncokb={this.props.oncokb}
                                isCanonicalTranscriptSelected={
                                    this.props.isCanonicalTranscriptSelected
                                }
                            />
                        </td>
                    </tr>

                    <tr>
                        <th>Functional prediction:</th>
                        <td>
                            <FunctionalPrediction
                                variantAnnotation={this.props.variantAnnotation}
                                isCanonicalTranscriptSelected={
                                    this.props.isCanonicalTranscriptSelected
                                }
                            />
                        </td>
                    </tr>

                    <tr>
                        <th>Population prevalence:</th>
                        <td>
                            <PopulationPrevalence
                                myVariantInfo={this.props.myVariantInfo}
                                chromosome={
                                    this.props.annotationInternal
                                        ? this.props.annotationInternal
                                              .genomicLocation.chromosome
                                        : null
                                }
                            />
                        </td>
                    </tr>
                </table>
            </div>
        );
    }
}

export default FeatureTable;
