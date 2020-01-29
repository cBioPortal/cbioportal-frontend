import {
    AlleleCount,
    AlleleFrequency,
    AlleleNumber,
    DefaultTooltip,
    Gnomad,
    Homozygotes,
    MyVariantInfo,
    VariantAnnotation,
} from 'cbioportal-frontend-commons';
import _ from 'lodash';
import { observer } from 'mobx-react';
import * as React from 'react';

import { GnomadSummary } from '../../model/GnomadSummary';
import GnomadFrequencyTable, {
    GnomadTableColumnName,
} from './GnomadFrequencyTable';

const GNOMAD_POPULATION_NAME: { [key: string]: string } = {
    African: 'afr',
    Latino: 'amr',
    Other: 'oth',
    'European (Non-Finnish)': 'nfe',
    'European (Finnish)': 'fin',
    'Ashkenazi Jewish': 'asj',
    'East Asian': 'eas',
    'South Asian': 'sas',
    Total: '',
};

export function calculateAlleleFrequency(
    count: number | null,
    totalNumber: number | null,
    frequency: number | null
): number {
    if (frequency !== null) {
        return frequency;
    } else {
        return count && totalNumber && totalNumber !== 0
            ? count / totalNumber
            : 0;
    }
}

export function generateGnomadUrl(
    chromosome: string | null,
    position: string | null,
    reference: string | null,
    variant: string | null
) {
    if (chromosome && position && reference && variant) {
        return `https://gnomad.broadinstitute.org/variant/${chromosome}-${position}-${reference}-${variant}`;
    } else {
        return 'https://gnomad.broadinstitute.org/';
    }
}

export function setGnomadTableData(
    key: string,
    data: Gnomad,
    result: { [key: string]: GnomadSummary }
) {
    // Access data by population name and column name in the format of: GnomadTableColumnName_POPULATION_NAME, e.g. "ac_afr"
    // If access "total" data, the name would be e.g. "ac" for alleleCount, "an" for alleleNumber
    const alleleCountName: keyof AlleleCount = (GNOMAD_POPULATION_NAME[key]
        ? GnomadTableColumnName.alleleCount + '_' + GNOMAD_POPULATION_NAME[key]
        : GnomadTableColumnName.alleleCount
    ).toString() as keyof AlleleCount;
    const alleleNumberName: keyof AlleleNumber = (GNOMAD_POPULATION_NAME[key]
        ? GnomadTableColumnName.alleleNumber + '_' + GNOMAD_POPULATION_NAME[key]
        : GnomadTableColumnName.alleleNumber
    ).toString() as keyof AlleleNumber;
    const homozygotesName: keyof Homozygotes = (GNOMAD_POPULATION_NAME[key]
        ? GnomadTableColumnName.homozygotes + '_' + GNOMAD_POPULATION_NAME[key]
        : GnomadTableColumnName.homozygotes
    ).toString() as keyof Homozygotes;
    const alleleFrequencyName: keyof AlleleFrequency = (GNOMAD_POPULATION_NAME[
        key
    ]
        ? GnomadTableColumnName.alleleFrequency +
          '_' +
          GNOMAD_POPULATION_NAME[key]
        : GnomadTableColumnName.alleleFrequency
    ).toString() as keyof AlleleFrequency;

    result[key] = {
        population: key,
        alleleCount: data.alleleCount[alleleCountName]
            ? data.alleleCount[alleleCountName]
            : 0,
        alleleNumber: data.alleleNumber[alleleNumberName]
            ? data.alleleNumber[alleleNumberName]
            : 0,
        homozygotes:
            data.homozygotes === undefined
                ? 'N/A'
                : data.homozygotes[homozygotesName],
        alleleFrequency: calculateAlleleFrequency(
            data.alleleCount[alleleCountName],
            data.alleleNumber[alleleNumberName],
            data.alleleFrequency[alleleFrequencyName]
        ),
    } as GnomadSummary;
}

export type GnomadFrequencyProps = {
    myVariantInfo?: MyVariantInfo;
    annotation?: VariantAnnotation;
};

@observer
export default class GnomadFrequency extends React.Component<
    GnomadFrequencyProps,
    {}
> {
    public gnomad() {
        const myVariantInfo = this.props.myVariantInfo;

        let gnomadUrl = '';
        let display: JSX.Element;
        let overlay: (() => JSX.Element) | null = null;
        let result: { [key: string]: GnomadSummary } = {};

        // Checking if gnomad data is valid
        if (
            myVariantInfo &&
            (myVariantInfo.gnomadExome || myVariantInfo.gnomadGenome)
        ) {
            // get gnomad link from chrom, location, ref and alt
            gnomadUrl =
                myVariantInfo && myVariantInfo.vcf
                    ? generateGnomadUrl(
                          this.props.annotation
                              ? this.props.annotation.seq_region_name
                              : null,
                          myVariantInfo.vcf.position,
                          myVariantInfo.vcf.ref,
                          myVariantInfo.vcf.alt
                      )
                    : '';

            const gnomadExome: { [key: string]: GnomadSummary } = {};
            const gnomadGenome: { [key: string]: GnomadSummary } = {};
            const gnomadResult: { [key: string]: GnomadSummary } = {};

            // If only gnomadExome data exist, show gnomadExome result in the table
            if (myVariantInfo.gnomadExome) {
                Object.keys(GNOMAD_POPULATION_NAME).forEach(key =>
                    setGnomadTableData(
                        key,
                        myVariantInfo.gnomadExome,
                        gnomadExome
                    )
                );
                result = gnomadExome;
            }

            // If only gnomadGenome data exist, show gnomadGenome result in the table
            if (myVariantInfo.gnomadGenome) {
                Object.keys(GNOMAD_POPULATION_NAME).forEach(key =>
                    setGnomadTableData(
                        key,
                        myVariantInfo.gnomadGenome,
                        gnomadGenome
                    )
                );
                result = gnomadGenome;
            }

            // If both gnomadExome and gnomadGenome exist, combine gnomadExome and gnomadGenome together
            if (myVariantInfo.gnomadExome && myVariantInfo.gnomadGenome) {
                Object.keys(GNOMAD_POPULATION_NAME).forEach(key => {
                    gnomadResult[key] = {
                        population: key,
                        alleleCount:
                            gnomadExome[key].alleleCount +
                            gnomadGenome[key].alleleCount,
                        alleleNumber:
                            gnomadExome[key].alleleNumber +
                            gnomadGenome[key].alleleNumber,
                        homozygotes:
                            gnomadExome[key].homozygotes === undefined ||
                            gnomadGenome[key].homozygotes === undefined
                                ? 'N/A'
                                : (
                                      parseInt(gnomadExome[key].homozygotes!) +
                                      parseInt(gnomadGenome[key].homozygotes!)
                                  ).toString(),
                        alleleFrequency: calculateAlleleFrequency(
                            gnomadExome[key].alleleCount +
                                gnomadGenome[key].alleleCount,
                            gnomadExome[key].alleleNumber +
                                gnomadGenome[key].alleleNumber,
                            null
                        ),
                    } as GnomadSummary;
                });
                result = gnomadResult;
            }

            // sort by frequency
            const sorted = _.sortBy(Object.values(result).slice(0, 8), [
                'alleleFrequency',
            ]).reverse();
            // add the total row at the bottom
            sorted.push(result['Total']);

            // The column will show the total frequency
            // Column will show 0 if the total frequency is 0, still has the tooltip to show the gnomad table (since gnomad data is still available)
            if (result['Total'].alleleFrequency === 0) {
                display = <span>0</span>;
            } else {
                // show frequency as number with 4 significant digits
                display = (
                    <span>
                        {result['Total'].alleleFrequency.toLocaleString(
                            undefined,
                            {
                                maximumSignificantDigits: 2,
                                minimumSignificantDigits: 2,
                            }
                        )}
                    </span>
                );
            }

            overlay = () => (
                <GnomadFrequencyTable data={sorted} gnomadUrl={gnomadUrl} />
            );
        } else {
            display = (
                <span
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'block',
                        overflow: 'hidden',
                    }}
                >
                    &nbsp;
                </span>
            );
            overlay = () => <span>Variant has no data in gnomAD.</span>;
        }
        return { overlay, display };
    }

    public render() {
        return (
            <DefaultTooltip
                overlay={this.gnomad().overlay}
                placement="topRight"
                trigger={['hover', 'focus']}
                destroyTooltipOnHide={true}
            >
                {this.gnomad().display}
            </DefaultTooltip>
        );
    }
}
