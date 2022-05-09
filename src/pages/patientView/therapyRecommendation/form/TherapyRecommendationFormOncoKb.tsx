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
import { RemoteData, IOncoKbData } from 'cbioportal-utils';
import PubMedCache from 'shared/cache/PubMedCache';
import { ICache } from 'cbioportal-frontend-commons';
import { DiscreteCopyNumberData, Mutation } from 'cbioportal-ts-api-client';
import { VariantAnnotation, MyVariantInfo } from 'genome-nexus-ts-api-client';
import AlleleFreqColumnFormatter from 'pages/patientView/mutation/column/AlleleFreqColumnFormatter';

interface ITherapyRecommendationFormOncoKbProps {
    show: boolean;
    patientID: string;
    oncoKbResult?: RemoteData<IOncoKbData | Error | undefined>;
    cnaOncoKbResult?: RemoteData<IOncoKbData | Error | undefined>;
    pubMedCache?: PubMedCache;
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

export default class TherapyRecommendationFormOncoKb extends React.Component<
    ITherapyRecommendationFormOncoKbProps,
    {}
> {
    private indicationSort(a: string, b: string): number {
        // Increase ascii code of parentheses to put these entries after text in the sort order
        a = a.trim().replace('(', '{');
        b = b.trim().replace('(', '{');
        return a < b ? -1 : 1;
    }

    private get pmidData(): ICache<any> {
        let oncoKbResults: IndicatorQueryResp[] = [];
        let pmids = [] as string[];
        if (this.props.pubMedCache && this.props.pubMedCache.cache) {
            if (
                this.props.oncoKbResult &&
                this.props.oncoKbResult.result &&
                !(this.props.oncoKbResult.result instanceof Error)
            ) {
                oncoKbResults.push(
                    ...Object.values(
                        this.props.oncoKbResult.result!.indicatorMap!
                    )
                );
            }
            if (
                this.props.cnaOncoKbResult &&
                this.props.cnaOncoKbResult.result &&
                !(this.props.cnaOncoKbResult.result instanceof Error)
            ) {
                oncoKbResults.push(
                    ...Object.values(
                        this.props.cnaOncoKbResult.result!.indicatorMap!
                    )
                );
            }

            if (oncoKbResults && oncoKbResults.length > 0) {
                oncoKbResults.map(result =>
                    result.treatments.map((treatment, treatmentIndex) =>
                        pmids.push(...treatment.pmids)
                    )
                );
                for (const pmid of pmids) {
                    this.props.pubMedCache.get(+pmid);
                }
            }
        }
        return (this.props.pubMedCache && this.props.pubMedCache.cache) || {};
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
            'Recommendation imported from OncoKB.'
        );
        therapyRecommendation.comment.push(
            ...treatment.approvedIndications.sort(this.indicationSort)
        );
        if (evidenceLevel.includes('R')) {
            therapyRecommendation.comment.push(
                'ATTENTION: Evidence level' +
                    evidenceLevel +
                    'represents resistance to the selected drug.'
            );
        }

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

        // References
        treatment.pmids.map(reference => {
            const cacheData = this.pmidData[reference];
            const articleContent = cacheData ? cacheData.data : null;
            console.group('Get Reference Title');
            console.log(articleContent);
            console.groupEnd();
            therapyRecommendation.references.push({
                pmid: _.toInteger(reference),
                name: articleContent ? articleContent.title : '',
            });
        });

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
        this.pmidData;
        if (
            !this.props.oncoKbResult ||
            !this.props.oncoKbResult.result ||
            this.props.oncoKbResult.result instanceof Error ||
            !this.props.cnaOncoKbResult ||
            !this.props.cnaOncoKbResult.result ||
            this.props.cnaOncoKbResult.result instanceof Error
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
                    <Modal.Body>There was an error querying OncoKB.</Modal.Body>
                </Modal>
            );
        } else {
            let oncoKbResults: IndicatorQueryResp[] = [];
            oncoKbResults.push(
                ...Object.values(this.props.oncoKbResult.result!.indicatorMap!)
            );

            oncoKbResults.push(
                ...Object.values(
                    this.props.cnaOncoKbResult.result!.indicatorMap!
                )
            );

            const groupStyles = {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 20,
                color: '#3786C2',
            };

            const groupBadgeStyles = {
                backgroundColor: '#3786C2',
                borderRadius: '2em',
                color: '#FFFFFF',
                display: 'inline-block',
                fontSize: 12,
                lineHeight: '1',
                minWidth: 1,
                padding: '0.16666666666667em 0.5em',
            };

            const groupedOptions = oncoKbResults.map(result => ({
                label: result.query.hugoSymbol + ' ' + result.query.alteration,
                options: result.treatments.map((treatment, treatmentIndex) => ({
                    label:
                        treatment.drugs.map(drug => drug.drugName).join(' + ') +
                        ' (' +
                        treatment.level.replace('_', ' ') +
                        ')',
                    value: {
                        result,
                        treatmentIndex,
                    },
                })),
            }));

            const filterOptions = (
                candidate: { label: string; value: any },
                input: string
            ) => {
                let searchString = input.toLowerCase();

                // default search
                if (candidate.label.toLowerCase().includes(searchString))
                    return true;

                // group label search
                const groups = groupedOptions.filter(group =>
                    group.label.toLowerCase().includes(searchString)
                );

                // check options in groups
                if (groups) {
                    for (const group of groups) {
                        if (
                            group.options.find(
                                option => option.label == candidate.label
                            )
                        )
                            return true;
                    }
                }

                return false;
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
                                <h5>Select OncoKB entry:</h5>
                                <Select
                                    options={groupedOptions}
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
                                    filterOption={filterOptions}
                                />
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
                                        this.convertAllTreatmentEntries(
                                            oncoKbResults
                                        )
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
