import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import * as React from 'react';
import { GnomadFrequency } from 'react-mutation-mapper';

import { MyVariantInfo } from 'genome-nexus-ts-api-client';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';

interface IPopulationPrevalenceProps {
    myVariantInfo: MyVariantInfo | undefined;
    chromosome: string | null;
}

interface IVcf {
    chrom: string;
    ref: string;
    alt: string;
    pos: number;
}

@observer
class PopulationPrevalence extends React.Component<IPopulationPrevalenceProps> {
    public gnomad(
        myVariantInfo: MyVariantInfo | undefined,
        chromosome: string | null
    ) {
        // generate gnomad url
        let gnomadUrl = 'https://gnomad.broadinstitute.org/';
        if (myVariantInfo && myVariantInfo.vcf && chromosome) {
            const vcfVariant: IVcf = {
                chrom: chromosome,
                ref: myVariantInfo.vcf.ref,
                alt: myVariantInfo.vcf.alt,
                pos: Number(myVariantInfo.vcf.position),
            };
            gnomadUrl = `https://gnomad.broadinstitute.org/variant/${vcfVariant.chrom}-${vcfVariant.pos}-${vcfVariant.ref}-${vcfVariant.alt}`;
        }

        if (
            this.props.myVariantInfo &&
            (this.props.myVariantInfo.gnomadExome ||
                this.props.myVariantInfo.gnomadGenome)
        ) {
            return (
                <div className={featureTableStyle['functional-group']}>
                    <div className={featureTableStyle['data-source']}>
                        {this.gnomadTooltip(gnomadUrl)}
                    </div>
                    <div className={featureTableStyle['data-with-link']}>
                        <a
                            href={gnomadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <GnomadFrequency
                                myVariantInfo={this.props.myVariantInfo}
                            />
                        </a>
                    </div>
                </div>
            );
        } else {
            return (
                <div className={featureTableStyle['functional-group']}>
                    <div className={featureTableStyle['data-source']}>
                        {this.gnomadTooltip(gnomadUrl)}
                    </div>
                    <div className={featureTableStyle['data-with-link']}>
                        <a
                            href={gnomadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            N/A
                        </a>
                    </div>
                </div>
            );
        }
    }

    public gnomadTooltip(gnomadUrl: string) {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <span>
                        <a
                            href={gnomadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            gnomAD
                        </a>
                        &nbsp;population allele frequencies. Overall population
                        <br />
                        allele frequency is shown. Hover over a frequency to see
                        <br />
                        the frequency for each specific population.
                    </span>
                }
            >
                <a href={gnomadUrl} target="_blank" rel="noopener noreferrer">
                    gnomAD&nbsp;
                    <i className="fas fa-external-link-alt" />
                </a>
            </DefaultTooltip>
        );
    }

    public dbsnp(myVariantInfo: MyVariantInfo | undefined) {
        const dbsnpUrl =
            myVariantInfo && myVariantInfo.dbsnp && myVariantInfo.dbsnp.rsid
                ? `https://www.ncbi.nlm.nih.gov/snp/${myVariantInfo.dbsnp.rsid}`
                : 'https://www.ncbi.nlm.nih.gov/snp/';
        if (
            this.props.myVariantInfo &&
            this.props.myVariantInfo.dbsnp &&
            this.props.myVariantInfo.dbsnp.rsid
        ) {
            return (
                <div className={featureTableStyle['functional-group']}>
                    <div className={featureTableStyle['data-source']}>
                        {this.dbsnpToolTip(dbsnpUrl)}
                    </div>
                    <div className={featureTableStyle['data-with-link']}>
                        <a
                            href={dbsnpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {this.props.myVariantInfo.dbsnp.rsid}
                        </a>
                    </div>
                </div>
            );
        } else {
            return (
                <div className={featureTableStyle['functional-group']}>
                    <div className={featureTableStyle['data-source']}>
                        {this.dbsnpToolTip(dbsnpUrl)}
                    </div>
                    <div className={featureTableStyle['data-with-link']}>
                        <a
                            href={dbsnpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            N/A
                        </a>
                    </div>
                </div>
            );
        }
    }

    public dbsnpToolTip(dbsnpUrl: string) {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <span>
                        The Single Nucleotide Polymorphism Database (
                        <a
                            href={dbsnpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            dbSNP
                        </a>
                        )<br />
                        is a free public archive for genetic variation within
                        and
                        <br />
                        across different species.
                    </span>
                }
            >
                <a href={dbsnpUrl} target="_blank" rel="noopener noreferrer">
                    dbSNP&nbsp;
                    <i className="fas fa-external-link-alt" />
                </a>
            </DefaultTooltip>
        );
    }

    public render() {
        return (
            <div>
                {this.gnomad(this.props.myVariantInfo, this.props.chromosome)}
                {this.dbsnp(this.props.myVariantInfo)}
            </div>
        );
    }
}

export default PopulationPrevalence;
