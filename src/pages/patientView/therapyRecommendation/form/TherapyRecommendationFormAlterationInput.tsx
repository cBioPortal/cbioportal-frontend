import React from 'react';
import {
    ITherapyRecommendation,
    IGeneticAlteration,
} from 'shared/model/TherapyRecommendation';
import { Mutation, DiscreteCopyNumberData } from 'cbioportal-ts-api-client';
import Select from 'react-select';
import _ from 'lodash';
import { flattenArray } from '../TherapyRecommendationTableUtils';
import AlleleFreqColumnFormatter from '../../mutation/column/AlleleFreqColumnFormatter';
import { VariantAnnotation, MyVariantInfo } from 'genome-nexus-ts-api-client';
import SampleManager from 'pages/patientView/SampleManager';
import { If, Then } from 'react-if';
import { components } from 'react-select';
import styles from '../style/therapyRecommendation.module.scss';

interface TherapyRecommendationFormAlterationInputProps {
    data: ITherapyRecommendation;
    mutations: Mutation[];
    indexedVariantAnnotations:
        | { [genomicLocation: string]: VariantAnnotation }
        | undefined;
    indexedMyVariantInfoAnnotations:
        | { [genomicLocation: string]: MyVariantInfo }
        | undefined;
    cna: DiscreteCopyNumberData[];
    onChange: (alterations: IGeneticAlteration[]) => void;
    sampleManager: SampleManager | null;
}

type MyOption = { label: string; value: IGeneticAlteration };

export class TherapyRecommendationFormAlterationInput extends React.Component<
    TherapyRecommendationFormAlterationInputProps,
    {}
> {
    public render() {
        const Option = (props: any) => {
            return (
                <div>
                    <components.Option {...props}>
                        <span style={{ marginRight: 5 }}>{props.label}</span>
                        <If
                            condition={
                                typeof props.value === 'object' &&
                                props.value !== null &&
                                'sampleIds' in props.value &&
                                props.value.sampleIds
                            }
                        >
                            <Then>
                                <span>
                                    {props.value.sampleIds.map(
                                        (sampleId: string) => (
                                            <span
                                                className={styles.genomicSpan}
                                            >
                                                {this.props.sampleManager!.getComponentForSample(
                                                    sampleId,
                                                    1,
                                                    ''
                                                )}
                                            </span>
                                        )
                                    )}
                                </span>
                            </Then>
                        </If>
                    </components.Option>
                </div>
            );
        };

        let allAlterations = this.props.mutations.map((mutation: Mutation) => {
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
            const myVariantInfo = this.props.indexedMyVariantInfoAnnotations![
                index
            ];
            let dbsnp;
            let clinvar;
            let cosmic;
            let gnomad;

            if (annotation && annotation.colocatedVariants) {
                const f = annotation.colocatedVariants.filter(value =>
                    value.dbSnpId.startsWith('rs')
                );
                if (f.length > 0) dbsnp = f[0].dbSnpId;
            }
            if (myVariantInfo) {
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
                sampleIds: [mutation.sampleId],
            } as IGeneticAlteration;
        });

        let allCna = this.props.cna.map((alt: DiscreteCopyNumberData) => {
            return {
                hugoSymbol: alt.gene.hugoGeneSymbol,
                alteration:
                    alt.alteration === -2 ? 'Deletion' : 'Amplification',
                entrezGeneId: alt.entrezGeneId,
                sampleIds: [alt.sampleId],
            } as IGeneticAlteration;
        });

        allAlterations.push(...allCna);

        console.group('Alteration Input');
        console.log(flattenArray(allAlterations));
        console.groupEnd();

        let foundIdx = -1;
        var groupedAlterations = allAlterations.reduce(
            (
                accu: IGeneticAlteration[],
                curr: IGeneticAlteration,
                idx: Number,
                arr: IGeneticAlteration[]
            ) => {
                if (
                    accu.some((value, resIdx, reArr) => {
                        // already present?
                        foundIdx = resIdx;
                        return (
                            value.hugoSymbol == curr.hugoSymbol &&
                            value.alteration == curr.alteration
                        );
                    })
                ) {
                    // already present, add sample
                    accu[foundIdx].sampleIds!.push(...curr.sampleIds!);
                } else {
                    // not yet present, push element
                    accu.push(curr);
                }
                return accu;
            },
            []
        );

        let groupedSortedAlterations = groupedAlterations.map(alt => ({
            ...alt,
            sampleIds: this.props
                .sampleManager!.getSampleIdsInOrder()
                .filter(item => alt.sampleIds!.includes(item)),
        }));

        console.group('Alteration Grouped');
        console.log(groupedAlterations);
        console.groupEnd();

        let alterationOptions = groupedSortedAlterations.map(
            (alteration: IGeneticAlteration) => ({
                value: alteration,
                label: alteration.hugoSymbol + ' ' + alteration.alteration,
            })
        );
        const alterationDefault =
            this.props.data.reasoning.geneticAlterations &&
            this.props.data.reasoning.geneticAlterations.map(
                (alteration: IGeneticAlteration) => ({
                    value: alteration,
                    label: alteration.hugoSymbol + ' ' + alteration.alteration,
                })
            );
        return (
            <Select
                options={alterationOptions}
                components={{ Option }}
                isMulti
                defaultValue={alterationDefault}
                name="positiveAlterationsSelect"
                className="basic-multi-select"
                classNamePrefix="select"
                onChange={(selectedOption: MyOption[]) => {
                    if (Array.isArray(selectedOption)) {
                        this.props.onChange(
                            selectedOption.map(option => option.value)
                        );
                    } else if (selectedOption === null) {
                        this.props.onChange([] as IGeneticAlteration[]);
                    }
                }}
            />
        );
    }
}
