import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import MutationMapperDataStore from 'shared/components/mutationMapper/MutationMapperDataStore';
import { ComparisonGroup, getSampleIdentifiers } from './GroupComparisonUtils';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import _ from 'lodash';

interface IFisherExactTwoSidedTestLabelProps {
    dataStore: MutationMapperDataStore;
    groups: ComparisonGroup[];
    maxSize: number;
}

export const FisherExactTwoSidedTestLabel: React.FC<IFisherExactTwoSidedTestLabelProps> = observer(
    ({ dataStore, groups, maxSize }: IFisherExactTwoSidedTestLabelProps) => {
        // initialize array of factorials for speed
        let f = new Array(maxSize + 1);
        f[0] = 0.0;
        for (let i = 1; i <= maxSize; i++) {
            f[i] = f[i - 1] + Math.log(i);
        }

        const mutationCountForActiveGeneGroupA = _.intersection(
            _.flatten(dataStore.tableData),
            _.flatten(dataStore.sortedFilteredGroupedData[0].data)
        ).length;
        const mutationCountForActiveGeneGroupB = _.intersection(
            _.flatten(dataStore.tableData),
            _.flatten(dataStore.sortedFilteredGroupedData[1].data)
        ).length;
        const sampleCountForGroupA = getSampleIdentifiers([groups[0]]).length;
        const sampleCountForGroupB = getSampleIdentifiers([groups[1]]).length;

        const getP = (a: number, b: number, c: number, d: number): number => {
            let n = a + b + c + d;
            if (n > maxSize) {
                return NaN;
            }
            let p;
            p =
                f[a + b] +
                f[c + d] +
                f[a + c] +
                f[b + d] -
                (f[a] + f[b] + f[c] + f[d] + f[n]);
            return Math.exp(p);
        };

        const getTwoTailedP = (
            a: number,
            b: number,
            c: number,
            d: number
        ): number => {
            let min, i;
            let n = a + b + c + d;
            if (n > maxSize) {
                return NaN;
            }
            let p = 0;

            let baseP = getP(a, b, c, d);
            // in order for a table under consideration to have its p-value included
            // in the final result, it must have a p-value less than the baseP, i.e.
            // Fisher's exact test computes the probability, given the observed marginal
            // frequencies, of obtaining exactly the frequencies observed and any configuration more extreme.
            // By "more extreme," we mean any configuration (given observed marginals) with a smaller probability of
            // occurrence in the same direction (one-tailed) or in both directions (two-tailed).

            let initialA = a,
                initialB = b,
                initialC = c,
                initialD = d;
            p += baseP;

            min = c < b ? c : b;
            for (i = 0; i < min; i++) {
                let tempP = getP(++a, --b, --c, ++d);
                if (tempP <= baseP) {
                    p += tempP;
                }
            }

            // reset the values to their original so we can repeat this process for the other side
            a = initialA;
            b = initialB;
            c = initialC;
            d = initialD;

            min = a < d ? a : d;
            for (i = 0; i < min; i++) {
                let pTemp = getP(--a, ++b, ++c, --d);
                if (pTemp <= baseP) {
                    p += pTemp;
                }
            }
            return p;
        };

        return (
            <div style={{ fontWeight: 'bold' }}>
                Fisher Exact Two-Sided Test p-value:{' '}
                {toConditionalPrecisionWithMinimum(
                    getTwoTailedP(
                        mutationCountForActiveGeneGroupA,
                        sampleCountForGroupA - mutationCountForActiveGeneGroupA,
                        mutationCountForActiveGeneGroupB,
                        sampleCountForGroupB - mutationCountForActiveGeneGroupB
                    ),
                    3,
                    0.01,
                    -10
                )}
            </div>
        );
    }
);
