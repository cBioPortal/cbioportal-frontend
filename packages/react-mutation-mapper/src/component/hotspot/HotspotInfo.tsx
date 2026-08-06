import * as React from 'react';

import hotspotStyles from './hotspotInfo.module.scss';
import { getNCBIlink } from 'cbioportal-frontend-commons';

export type HotspotInfoProps = {
    isHotspot: boolean;
    is3dHotspot: boolean;
    isHotspotV3?: boolean;
    is3dHotspotV3?: boolean;
    count?: number;
    customInfo?: JSX.Element;
};

export function title(
    isHotspot: boolean,
    is3dHotspot: boolean,
    count?: number,
    customInfo?: JSX.Element,
    isHotspotV3?: boolean,
    is3dHotspotV3?: boolean
) {
    const recurrentHotspot = isHotspot ? (
        <b>Recurrent Hotspot{isHotspotV3 ? ' (new in V3)' : ''}</b>
    ) : null;
    const maybeAnd = isHotspot && is3dHotspot ? <span>and</span> : null;
    const clusteredHotspot = is3dHotspot ? (
        <b>3D Clustered Hotspot{is3dHotspotV3 ? ' (new in V3)' : ''}</b>
    ) : null;

    let countInfo: JSX.Element | null = null;

    if (count) {
        const sample = count > 1 ? 'samples' : 'sample';
        countInfo = (
            <span>
                <b>{count}</b> {sample} with
            </span>
        );
    }

    return (
        <span>
            {countInfo} {recurrentHotspot} {maybeAnd} {clusteredHotspot}{' '}
            {customInfo}
        </span>
    );
}

// Chang 2016 -> Chang 2018 -> Bandlamudi 2026 -> Gao 2017, i.e. publication
// year order. When both a recurrent and a 3D citation apply, the recurrent
// papers are joined with plain commas (no Oxford comma) and "and" only
// precedes the 3D citation; with only recurrent papers, the list gets an
// Oxford comma before "and".
function citations(isHotspot: boolean, is3dHotspot: boolean) {
    const chang2016 = (
        <a
            href={getNCBIlink(`/pubmed/26619011`)}
            target="_blank"
            rel="noopener noreferrer"
        >
            Chang et al. 2016
        </a>
    );
    const chang2018 = (
        <a
            href={getNCBIlink(`/pubmed/29247016`)}
            target="_blank"
            rel="noopener noreferrer"
        >
            Chang et al. 2018
        </a>
    );
    const bandlamudi2026 = (
        <a
            href={getNCBIlink(`/pubmed/41895280`)}
            target="_blank"
            rel="noopener noreferrer"
        >
            Bandlamudi et al. 2026
        </a>
    );
    const gao2017 = (
        <a
            href={getNCBIlink(`/pubmed/28115009`)}
            target="_blank"
            rel="noopener noreferrer"
        >
            Gao et al. 2017
        </a>
    );

    if (isHotspot && is3dHotspot) {
        return (
            <>
                {chang2016}, {chang2018}, {bandlamudi2026} and {gao2017} (3D)
            </>
        );
    } else if (isHotspot) {
        return (
            <>
                {chang2016}, {chang2018}, and {bandlamudi2026}
            </>
        );
    } else if (is3dHotspot) {
        return <>{gao2017} (3D)</>;
    } else {
        return null;
    }
}

export function publication(isHotspot: boolean, is3dHotspot: boolean) {
    const recurrentHotspot = isHotspot
        ? 'a recurrent hotspot (statistically significant)'
        : '';
    const maybeAnd = isHotspot && is3dHotspot ? 'and' : '';
    const clusteredHotspot = is3dHotspot ? 'a 3D clustered hotspot' : '';

    return (
        <span>
            This mutated amino acid was identified as {recurrentHotspot}{' '}
            {maybeAnd} {clusteredHotspot} in a population-scale cohort of tumor
            samples of various cancer types using methodology based in part on{' '}
            {citations(isHotspot, is3dHotspot)}.
        </span>
    );
}

export function link(isHotspot: boolean, is3dHotspot: boolean) {
    const recurrentLink = isHotspot ? (
        <a
            href="https://www.cancerhotspots.org/"
            target="_blank"
            rel="noopener noreferrer"
        >
            https://cancerhotspots.org/
        </a>
    ) : (
        ''
    );

    const maybeAnd = isHotspot && is3dHotspot ? 'and' : '';

    const clusteredLink = is3dHotspot ? (
        <a
            href="https://www.3dhotspots.org/"
            target="_blank"
            rel="noopener noreferrer"
        >
            https://3dhotspots.org/
        </a>
    ) : (
        ''
    );

    return (
        <span>
            Explore all mutations at {recurrentLink} {maybeAnd} {clusteredLink}.
        </span>
    );
}

export const HotspotInfo: React.FunctionComponent<HotspotInfoProps> = props => {
    const {
        isHotspot,
        is3dHotspot,
        isHotspotV3,
        is3dHotspotV3,
        count,
        customInfo,
    } = props;

    return (
        <span className={hotspotStyles['hotspot-info']}>
            {title(
                isHotspot,
                is3dHotspot,
                count,
                customInfo,
                isHotspotV3,
                is3dHotspotV3
            )}
            <br />
            {publication(isHotspot, is3dHotspot)}
            <br />
            <br />
            {link(isHotspot, is3dHotspot)}
        </span>
    );
};
