import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import GenomeNexusCache, {GenomeNexusCacheDataType} from "shared/cache/GenomeNexusEnrichment";
import {Mutation, DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";
import MutationAssessor from "shared/components/annotation/genomeNexus/MutationAssessor";
import Sift from "shared/components/annotation/genomeNexus/Sift";
import PolyPhen2 from "shared/components/annotation/genomeNexus/PolyPhen2";

export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.left = '10px';
}

export default class FunctionalImpactColumnFormatter {

    public static mutationAssessorTooltip() {
        return <div style={{maxWidth:450}}><a
        href="http://mutationassessor.org/r3/">Mutation Assessor</a> predicts
        the functional impact of amino-acid substitutions in proteins, such as
        mutations discovered in cancer or missense polymorphisms. The
        functional impact is assessed based on evolutionary conservation of the
        affected amino acid in protein homologs. The method has been validated
        on a large set (60k) of disease associated (OMIM) and polymorphic
        variants.</div>;
    }

    public static siftTooltip() {
        return <div style={{maxWidth:450}}><a
        href="http://sift.bii.a-star.edu.sg/">SIFT</a> predicts whether an
        amino acid substitution affects protein function based on sequence
        homology and the physical properties of amino acids. SIFT can be
        applied to naturally occurring nonsynonymous polymorphisms and
        laboratory-induced missense mutations.</div>;
    }

    public static polyPhen2Tooltip() {
        return <div style={{maxWidth:450}}><a
        href="http://genetics.bwh.harvard.edu/pph2/">PolyPhen-2 </a>
        (Polymorphism Phenotyping v2) is a tool which predicts possible impact
        of an amino acid substitution on the structure and function of a human
        protein using straightforward physical and comparative considerations.
        </div>;
    }
    
    public static headerRender(name: string) {
        const arrowContent = <div className="rc-tooltip-arrow-inner"  />;
        return (
            <div>
                {name}<br />
                <div style={{height:14}}>
                    <DefaultTooltip
                        overlay={FunctionalImpactColumnFormatter.mutationAssessorTooltip}
                        placement="topLeft"
                        trigger={['hover', 'focus']}
                        arrowContent={arrowContent}
                        destroyTooltipOnHide={false}
                        onPopupAlign={placeArrow}
                    >
                        <span style={{display:'inline-block',width:22}}>
                            <img
                                height={14} width={14}
                                src={require("./mutationAssessor.png")}
                                // className={tooltipStyles['mutation-assessor-main-img']}
                                alt='Sift'
                            />
                        </span>
                    </DefaultTooltip>
                    <DefaultTooltip
                        overlay={FunctionalImpactColumnFormatter.siftTooltip}
                        placement="topLeft"
                        trigger={['hover', 'focus']}
                        arrowContent={arrowContent}
                        destroyTooltipOnHide={false}
                        onPopupAlign={placeArrow}
                    >
                        <span style={{display:'inline-block',width:22}}>
                            <img
                                height={14} width={14}
                                src={require("./siftFunnel.png")}
                                // className={tooltipStyles['mutation-assessor-main-img']}
                                alt='SIFT'
                            />
                        </span>
                    </DefaultTooltip>
                    <DefaultTooltip
                        overlay={FunctionalImpactColumnFormatter.polyPhen2Tooltip}
                        placement="topLeft"
                        trigger={['hover', 'focus']}
                        arrowContent={arrowContent}
                        destroyTooltipOnHide={false}
                        onPopupAlign={placeArrow}
                    >
                        <span style={{display:'inline-block',width:22}}>
                            <img
                                height={14} width={14}
                                src={require("./polyPhen-2.png")}
                                // className={tooltipStyles['mutation-assessor-main-img']}
                                alt='PolyPhen-2'
                            />
                        </span>
                    </DefaultTooltip>
                </div>
            </div>
        );
    }

    public static renderFunction(data:Mutation[], genomeNexusCache:GenomeNexusCache) {
        const genomeNexusData = FunctionalImpactColumnFormatter.getGenomeNexusData(data, genomeNexusCache);
        return (
                <div>
                    {FunctionalImpactColumnFormatter.makeFuncionalImpactViz(genomeNexusData)}
                </div>
        );
    };

    private static getGenomeNexusData(data:Mutation[], cache:GenomeNexusCache):GenomeNexusCacheDataType | null {
        if (data.length === 0) {
            return null;
        }
        return cache.get(data[0]);
    }

    private static makeFuncionalImpactViz(genomeNexusData:GenomeNexusCacheDataType | null) {
        let status:TableCellStatus | null = null;
        if (genomeNexusData === null) {
            status = TableCellStatus.LOADING;
        } else if (genomeNexusData.status === "error") {
            status = TableCellStatus.ERROR;
        } else if (genomeNexusData.data === null) {
            status = TableCellStatus.NA;
        } else {
            // TODO: handle multiple transcripts instead of just picking first one
            return (
                <div>
                    <MutationAssessor mutationAssessor={genomeNexusData.data.mutation_assessor.annotation} />
                    <Sift siftScore={parseFloat(genomeNexusData.data.transcript_consequences[0].sift_score)} siftPrediction={genomeNexusData.data.transcript_consequences[0].sift_prediction} />
                    <PolyPhen2 polyPhenScore={parseFloat(genomeNexusData.data.transcript_consequences[0].polyphen_score)} polyPhenPrediction={genomeNexusData.data.transcript_consequences[0].polyphen_prediction} />
                </div>
            );
        }
        if (status !== null) {
            return (
                <TableCellStatusIndicator
                    status={status}
                />
            );
        }
    }
}
