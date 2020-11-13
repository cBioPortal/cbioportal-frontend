import * as React from 'react';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { Mutation, RemoteData } from 'cbioportal-utils';

import { defaultSortMethod } from '../../util/ReactTableUtils';
import { getHgvscColumnData } from './HgvsHelper';

type HgvscProps = {
    mutation: Mutation;
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    selectedTranscriptId?: string;
};

export function download(hgvsc?: string | null): string {
    return hgvsc || '';
}

export function sortValue(hgvsc?: string | null): number | null {
    return hgvsc ? parseInt(hgvsc.split('c.')[1]) : null;
}

export function hgvscSortMethod(a: string | null, b: string | null) {
    return defaultSortMethod(sortValue(a), sortValue(b));
}

export default class Hgvsc extends React.Component<HgvscProps, {}> {
    get hgvsc() {
        return getHgvscColumnData(
            this.props.mutation,
            this.props.indexedVariantAnnotations,
            this.props.selectedTranscriptId
        );
    }

    public render() {
        return <div>{this.hgvsc}</div>;
    }
}
