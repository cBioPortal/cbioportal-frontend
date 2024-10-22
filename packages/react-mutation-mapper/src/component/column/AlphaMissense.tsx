import { observer } from 'mobx-react';
import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { defaultSortMethod, RemoteData } from 'cbioportal-utils';
// import styles from './alphaMissense.module.scss'
import { getAlphaMissenseColumnData } from './AlphaMissenseHelper';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
type AlphaMissenseProps = {
    mutation: Mutation;
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    // selectedTranscriptId?: string;
};
export function download(alphaMissense?: string | null): string {
    return alphaMissense || 'N/A';
}

export function sortValue(alphaMissense?: string | null): number | null {
    const score = alphaMissense?.split('|')[1];
    return score ? parseFloat(score) : 0.0;
}

// Main component for rendering AlphaMissense data
@observer
export default class AlphaMissense extends React.Component<
    AlphaMissenseProps,
    {}
> {
    get alphaMissense() {
        return getAlphaMissenseColumnData(
            this.props.mutation,
            this.props.indexedVariantAnnotations
        );
    }
    public render() {
        const pathogenicity = this.alphaMissense?.split('|')[0];
        const score = this.alphaMissense?.split('|')[1];
        return (
            <span>
                {/*{AlphaMissenseColumnFormatter.getAlphaMissenseDataViz(*/}
                {/*    alphaMissenseCache*/}
                {/*)}*/}
                <DefaultTooltip
                    overlay={() => <div style={{ maxWidth: 300 }}>{score}</div>}
                    placement="topLeft"
                >
                    <span
                        style={{
                            width: '24px',
                            textAlign: 'center',
                        }}
                    >
                        {pathogenicity}
                    </span>
                </DefaultTooltip>
            </span>
        );
    }
}

// // Helper function to get GenomeNexus cache data
// function getGenomeNexusDataFromCache(
//     data: Mutation[],
//     cache: indexedVariantAnnotations | undefined
// ): GenomeNexusCacheDataType | null {
//     if (data.length === 0 || !cache) return null;
//     return cache.annoation_summery.get(data[0]);
// }
//

//
// indexedVariantAnnotations.annotation_summary?: RemoteData<
//     { [genomicLocation: string]: VariantAnnotation } | undefined
// >;
