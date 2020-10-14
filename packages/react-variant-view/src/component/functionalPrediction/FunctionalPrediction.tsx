import {
    MutationAssessor as MutationAssessorData,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';
import { SHOW_MUTATION_ASSESSOR } from '../../util/Constants';
import MutationAssessor from './MutationAssessor';
import PolyPhen2 from './PolyPhen2';
import Sift from './Sift';

// Most of this component comes from cBioPortal-frontend

interface IFunctionalPredictionProps {
    variantAnnotation?: VariantAnnotation;
    isCanonicalTranscriptSelected: boolean;
}

interface IFunctionalImpactData {
    mutationAssessor: MutationAssessorData | undefined;
    siftScore: number | undefined;
    siftPrediction: string | undefined;
    polyPhenScore: number | undefined;
    polyPhenPrediction: string | undefined;
}

@observer
class FunctionalPrediction extends React.Component<IFunctionalPredictionProps> {
    public getData(
        genomeNexusData: VariantAnnotation | undefined
    ): IFunctionalImpactData {
        const mutationAssessor =
            genomeNexusData &&
            genomeNexusData.mutation_assessor &&
            genomeNexusData.mutation_assessor.annotation;
        const siftScore =
            genomeNexusData &&
            genomeNexusData.transcript_consequences &&
            genomeNexusData.transcript_consequences[0].sift_score;
        const siftPrediction =
            genomeNexusData &&
            genomeNexusData.transcript_consequences &&
            genomeNexusData.transcript_consequences[0].sift_prediction;
        const polyPhenScore =
            genomeNexusData &&
            genomeNexusData.transcript_consequences &&
            genomeNexusData.transcript_consequences[0].polyphen_score;
        const polyPhenPrediction =
            genomeNexusData &&
            genomeNexusData.transcript_consequences &&
            genomeNexusData.transcript_consequences[0].polyphen_prediction;

        return {
            mutationAssessor,
            siftScore,
            siftPrediction,
            polyPhenScore,
            polyPhenPrediction,
        };
    }
    public render() {
        const data = this.getData(this.props.variantAnnotation);
        return (
            <div>
                <PolyPhen2
                    polyPhenScore={data.polyPhenScore}
                    polyPhenPrediction={data.polyPhenPrediction}
                />
                {SHOW_MUTATION_ASSESSOR && (
                    <MutationAssessor
                        mutationAssessor={data.mutationAssessor}
                        isCanonicalTranscriptSelected={
                            this.props.isCanonicalTranscriptSelected
                        }
                    />
                )}
                <Sift
                    siftScore={data.siftScore}
                    siftPrediction={data.siftPrediction}
                />
            </div>
        );
    }
}

export default FunctionalPrediction;
