import * as React from 'react';
import * as _ from 'lodash';
import { Modal, Button } from 'react-bootstrap';
import {
    ITherapyRecommendation,
    EvidenceLevel,
    IGeneticAlteration,
} from 'shared/model/TherapyRecommendation';
import Select from 'react-select';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import { getNewTherapyRecommendation } from '../TherapyRecommendationTableUtils';
import { DiscreteCopyNumberData, Mutation } from 'cbioportal-ts-api-client';
import { VariantAnnotation, MyVariantInfo } from 'genome-nexus-ts-api-client';
import AlleleFreqColumnFormatter from 'pages/patientView/mutation/column/AlleleFreqColumnFormatter';

interface ITherapyRecommendationFormOtherMtbProps {
    show: boolean;
    patientID: string;
    fhirsparkResult?: ITherapyRecommendation[];
    title: string;
    userEmailAddress: string;
    mutations: Mutation[];
    cna: DiscreteCopyNumberData[];
    indexedVariantAnnotations:
        | { [genomicLocation: string]: VariantAnnotation }
        | undefined;
    indexedMyVariantInfoAnnotations:
        | { [genomicLocation: string]: MyVariantInfo }
        | undefined;
    onHide: (
        newTherapyRecommendation?:
            | ITherapyRecommendation
            | ITherapyRecommendation[]
    ) => void;
}

export default class TherapyRecommendationFormOtherMtb extends React.Component<
    ITherapyRecommendationFormOtherMtbProps,
    {}
> {
    private indicationSort(a: string, b: string): number {
        // Increase ascii code of parentheses to put these entries after text in the sort order
        a = a.trim().replace('(', '{');
        b = b.trim().replace('(', '{');
        return a < b ? -1 : 1;
    }

    private therapyRecommendationFromTreatmentEntry(
        result: IndicatorQueryResp,
        treatmentIndex: number
    ): ITherapyRecommendation | null {
        let therapyRecommendation: ITherapyRecommendation = getNewTherapyRecommendation(
            this.props.patientID
        );
        let treatment = result.treatments[treatmentIndex];
        let evidenceLevel = treatment.level;

        // Treatments
        treatment.drugs.map(drug => {
            therapyRecommendation.treatments.push({
                name: drug.drugName,
                ncit_code: drug.ncitCode,
                synonyms: drug.synonyms.toString(),
            });
        });

        // Comment
        therapyRecommendation.comment.push(
            'Recommendation imported from other MTB.'
        );
        therapyRecommendation.comment.push(
            ...treatment.approvedIndications.sort(this.indicationSort)
        );

        let allAlterations = this.props.mutations.map((mutation: Mutation) => {
            let dbsnp;
            let clinvar;
            let cosmic;
            let gnomad;

            if (
                mutation.chr &&
                mutation.startPosition &&
                mutation.endPosition &&
                mutation.referenceAllele &&
                mutation.variantAllele
            ) {
                const index =
                    mutation.chr +
                    ',' +
                    mutation.startPosition +
                    ',' +
                    mutation.endPosition +
                    ',' +
                    mutation.referenceAllele +
                    ',' +
                    mutation.variantAllele;
                const annotation = this.props.indexedVariantAnnotations![index];
                const myVariantInfo = this.props
                    .indexedMyVariantInfoAnnotations![index];

                if (annotation && annotation.colocatedVariants) {
                    const f = annotation.colocatedVariants.filter(value =>
                        value.dbSnpId.startsWith('rs')
                    );
                    if (f.length > 0) dbsnp = f[0].dbSnpId;
                }

                if (myVariantInfo) {
                    if (myVariantInfo.dbsnp) {
                        dbsnp = myVariantInfo.dbsnp.rsid;
                    }
                    if (myVariantInfo.clinVar) {
                        clinvar = myVariantInfo.clinVar.variantId;
                    }
                    if (myVariantInfo.cosmic) {
                        cosmic = myVariantInfo.cosmic.cosmicId;
                    }
                    if (myVariantInfo.gnomadExome) {
                        gnomad = myVariantInfo.gnomadExome.alleleFrequency.af;
                    }
                }
            }

            return {
                hugoSymbol: mutation.gene.hugoGeneSymbol,
                alteration: mutation.proteinChange,
                entrezGeneId: mutation.entrezGeneId,
                chromosome: mutation.chr,
                start: mutation.startPosition,
                end: mutation.endPosition,
                ref: mutation.referenceAllele,
                alt: mutation.variantAllele,
                aminoAcidChange: mutation.aminoAcidChange,
                alleleFrequency: AlleleFreqColumnFormatter.calcFrequency(
                    mutation
                ),
                dbsnp,
                clinvar,
                cosmic,
                gnomad,
            } as IGeneticAlteration;
        });
        const allCna = this.props.cna.map((alt: DiscreteCopyNumberData) => {
            return {
                hugoSymbol: alt.gene.hugoGeneSymbol,
                alteration:
                    alt.alteration === -2 ? 'Deletion' : 'Amplification',
                entrezGeneId: alt.entrezGeneId,
            } as IGeneticAlteration;
        });

        allAlterations.push(...allCna);

        const mutation = allAlterations.filter(
            value =>
                value.entrezGeneId == result.query.entrezGeneId &&
                value.hugoSymbol == result.query.hugoSymbol &&
                value.alteration === result.query.alteration
        )[0];

        // Reasoning
        therapyRecommendation.reasoning.geneticAlterations = [mutation];

        // Evidence Level
        therapyRecommendation.evidenceLevel = EvidenceLevel.NA;

        return therapyRecommendation;
    }

    private convertAllTreatmentEntries(
        results: IndicatorQueryResp[]
    ): ITherapyRecommendation[] {
        let therapyRecommendations: ITherapyRecommendation[] = [];

        results.map(result =>
            result.treatments.map((treatment, treatmentIndex) => {
                let therapyRecommendation = this.therapyRecommendationFromTreatmentEntry(
                    result,
                    treatmentIndex
                );
                if (therapyRecommendation) {
                    therapyRecommendations.push(therapyRecommendation);
                }
            })
        );

        return therapyRecommendations;
    }

    public render() {
        let selectedTherapyRecommendation: ITherapyRecommendation;
        if (
            this.props.fhirsparkResult == null ||
            this.props.fhirsparkResult.length == 0
        ) {
            return (
                <Modal
                    show={this.props.show}
                    onHide={() => {
                        this.props.onHide(undefined);
                    }}
                    backdrop={'static'}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>{this.props.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Did not find any mathing recommendations from other MTB
                        session.
                    </Modal.Body>
                </Modal>
            );
        } else {
            const groupStyles = {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 18,
            };
            const groupBadgeStyles = {
                backgroundColor: '#EBECF0',
                borderRadius: '2em',
                color: '#172B4D',
                display: 'inline-block',
                fontSize: 12,
                lineHeight: '1',
                minWidth: 1,
                padding: '0.16666666666667em 0.5em',
            };
            return (
                <Modal
                    show={this.props.show}
                    onHide={() => {
                        this.props.onHide(undefined);
                    }}
                    backdrop={'static'}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>{this.props.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <form className="form">
                            <div className="form-group">
                                <h5>Select entry from other MTB:</h5>
                                {/* <Select
                                    options={this.props.fhirsparkResult.map(result => ({
                                        label:
                                            result.query.hugoSymbol +
                                            ' ' +
                                            result.query.alteration,
                                        options: result.treatments.map(
                                            (treatment, treatmentIndex) => ({
                                                label:
                                                    treatment.drugs
                                                        .map(
                                                            drug =>
                                                                drug.drugName
                                                        )
                                                        .join(' + ') +
                                                    ' (' +
                                                    treatment.level.replace(
                                                        '_',
                                                        ' '
                                                    ) +
                                                    ')',
                                                value: {
                                                    result,
                                                    treatmentIndex,
                                                },
                                            })
                                        ),
                                    }))}
                                    name="oncoKBResult"
                                    className="basic-select"
                                    classNamePrefix="select"
                                    onChange={(selectedOption: {
                                        label: string;
                                        value: {
                                            result: IndicatorQueryResp;
                                            treatmentIndex: number;
                                        };
                                    }) => {
                                        let therapyRecommendation = this.therapyRecommendationFromTreatmentEntry(
                                            selectedOption.value.result,
                                            selectedOption.value.treatmentIndex
                                        );
                                        console.log(selectedOption);
                                        selectedTherapyRecommendation = therapyRecommendation!;
                                    }}
                                    formatGroupLabel={(data: any) => (
                                        <div
                                            style={groupStyles}
                                            // onClick={(e: any) => {
                                            //     e.stopPropagation();
                                            //     e.preventDefault();
                                            //     console.log('Group heading clicked', data);
                                            // }}
                                        >
                                            <span>{data.label}</span>
                                            <span style={groupBadgeStyles}>
                                                {data.options.length}
                                            </span>
                                        </div>
                                    )}
                                /> */}
                            </div>
                        </form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            type="button"
                            bsStyle="default"
                            onClick={() => {
                                this.props.onHide(undefined);
                            }}
                        >
                            Dismiss
                        </Button>
                        <Button
                            type="button"
                            bsStyle="info"
                            onClick={() => {
                                window.confirm(
                                    'Are you sure you wish to add all entries automatically?'
                                ) &&
                                    this.props.onHide(
                                        this.props.fhirsparkResult
                                    );
                            }}
                        >
                            Add all entries
                        </Button>
                        <Button
                            type="button"
                            bsStyle="primary"
                            onClick={() => {
                                this.props.onHide(
                                    selectedTherapyRecommendation
                                );
                            }}
                        >
                            Add entry
                        </Button>
                    </Modal.Footer>
                </Modal>
            );
        }
    }
}
