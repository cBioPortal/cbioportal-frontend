import { DefaultTooltip } from 'cbioportal-frontend-commons';
import * as React from 'react';
import { Tab, Table, Tabs } from 'react-bootstrap';
import ReactTable from 'react-table';
import OncokbLegendContent from './OncokbLegendContent';

export type AnnotationHeaderTooltipCardInfoProps = {
    sourceUrl: string;
    sourceName: string;
    sourceDescription: string;
    reference?: string;
    referenceUrl?: string;
};

export type LegendDescription = {
    legend: JSX.Element;
    description: string;
};

export enum AnnotationSources {
    ONCOKB = 'oncokb',
    CIVIC = 'civic',
    MY_CANCER_GENOME = 'myCancerGenome',
    CANCER_HOTSPOTS = 'cancerHotspots',
}

export const sourceTooltipInfo = {
    [AnnotationSources.ONCOKB]: [
        {
            sourceUrl: 'https://www.oncokb.org/',
            sourceName: 'Oncokb',
            sourceDescription:
                'a precision oncology knowledge base and contains information about the effects and treatment implications of variants in cancer',
            reference: 'Chakravarty et al. 2017',
            referenceUrl: 'https://pubmed.ncbi.nlm.nih.gov/28890946/',
        },
    ],
    [AnnotationSources.CIVIC]: [
        {
            sourceUrl: 'https://civicdb.org/',
            sourceName: 'CIViC',
            sourceDescription:
                'a community knowledgebase for expert crowdsourcing the clinical interpretation of variants in cancer',
            reference: 'Griffith et al 2017',
            referenceUrl: 'https://pubmed.ncbi.nlm.nih.gov/28138153/',
        },
    ],
    [AnnotationSources.MY_CANCER_GENOME]: [
        {
            sourceUrl: 'https://www.mycancergenome.org/',
            sourceName: 'My Cancer Genome',
            sourceDescription:
                'a precision cancer medicine knowledge resource (data version Mar 2016)',
        },
    ],
    [AnnotationSources.CANCER_HOTSPOTS]: [
        {
            sourceUrl: 'https://www.cancerhotspots.org/',
            sourceName: 'Cancer Hotspots',
            sourceDescription:
                'statistically significant recurrent mutational hotspots in cancer',
            reference: 'Chang et al. 2018',
            referenceUrl: 'https://pubmed.ncbi.nlm.nih.gov/29247016/',
        },
        {
            sourceUrl: 'https://www.3dhotspots.org/',
            sourceName: '3D Cancer Hotspots',
            sourceDescription:
                'statistically significant recurrent 3D clustered hotspots in cancer',
            reference: 'Gao et al. 2017',
            referenceUrl: 'https://pubmed.ncbi.nlm.nih.gov/28115009/',
        },
    ],
};

export const civicData: LegendDescription[] = [
    {
        legend: (
            <img
                src={require('../../../../../../src/rootImages/civic-logo.png')}
                style={{ height: 14, width: 14, marginLeft: 6 }}
            />
        ),
        description: 'Is in CIViC with oncogenic activity information',
    },
    {
        legend: (
            <img
                src={require('../../../../../../src/rootImages/civic-logo-no-variants.png')}
                style={{ height: 14, width: 14, marginLeft: 6 }}
            />
        ),
        description: 'Is in CIViC but no oncogenic activity information',
    },
    {
        legend: <span />,
        description: 'Not in CIViC',
    },
];

export const myCancerGenomeData: LegendDescription[] = [
    {
        legend: (
            <img
                src={require('../../../../../../src/rootImages/mcg_logo.png')}
                style={{ height: 14, width: 14, marginLeft: 8 }}
            />
        ),
        description: 'Is in My Cancer Genome',
    },
    {
        legend: <span />,
        description: 'Not in My Cancer Genome',
    },
];

export const cancerHotspotsData: LegendDescription[] = [
    {
        legend: (
            <img
                src={require('../../../../../../src/rootImages/cancer-hotspots.svg')}
                style={{ height: 14, width: 14, marginLeft: 8 }}
            />
        ),
        description: 'Recurrent hotspot or recurrent + 3D hotspot',
    },
    {
        legend: (
            <img
                src={require('../../../annotation/images/3d-hotspots.svg')}
                style={{ height: 14, width: 14, marginLeft: 8 }}
            />
        ),
        description: '3D clustered hotspot',
    },
    {
        legend: <span />,
        description: 'Not a known hotspot',
    },
];

const columns = [
    {
        Header: 'Legend',
        accessor: 'legend',
        maxWidth: 60,
    },
    {
        Header: 'Description',
        accessor: 'description',
        maxWidth: 540,
        style: { 'white-space': 'unset' }, // allow for words wrap inside only this cell
    },
];

const AnnotationHeaderTooltipCardInfo: React.FunctionComponent<{
    infoProps: AnnotationHeaderTooltipCardInfoProps[];
}> = props => {
    return (
        <div>
            {props.infoProps.map(p => {
                return (
                    <div>
                        <a href={p.sourceUrl} target="_blank">
                            {p.sourceName}
                        </a>
                        : {p.sourceDescription}{' '}
                        {p.reference && p.referenceUrl && (
                            <>
                                (
                                <a href={p.referenceUrl} target="_blank">
                                    {p.reference}
                                </a>
                                )
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export const LegendTable: React.FunctionComponent<{
    legendDescriptions: LegendDescription[];
}> = props => {
    return (
        <ReactTable
            data={props.legendDescriptions}
            columns={columns}
            showPagination={false}
            pageSize={props.legendDescriptions.length}
            className="-striped -highlight"
        />
    );
};

export const AnnotationHeader: React.FunctionComponent<{
    name: string;
    width: number;
}> = props => {
    return (
        <span>
            {props.name}
            <br />
            <DefaultTooltip
                placement="top"
                overlay={
                    <AnnotationHeaderTooltipCard
                        InfoProps={sourceTooltipInfo[AnnotationSources.ONCOKB]}
                        legendDescriptions={civicData}
                        overrideContent={<OncokbLegendContent />}
                    />
                }
            >
                <img
                    src={require('../../../../../../src/rootImages/oncokb-oncogenic-1.svg')}
                    style={{
                        height: 16,
                        width: 16,
                        marginLeft: 5,
                        marginBottom: 0,
                        marginRight:
                            props.width - 22 > 0 ? props.width - 22 : 0,
                    }}
                />
            </DefaultTooltip>
            <DefaultTooltip
                placement="top"
                overlay={
                    <AnnotationHeaderTooltipCard
                        InfoProps={sourceTooltipInfo[AnnotationSources.CIVIC]}
                        legendDescriptions={civicData}
                    />
                }
            >
                <img
                    src={require('../../../../../../src/rootImages/civic-logo.png')}
                    style={{ height: 14, width: 14, marginLeft: 6 }}
                />
            </DefaultTooltip>
            <DefaultTooltip
                placement="top"
                overlay={
                    <AnnotationHeaderTooltipCard
                        InfoProps={
                            sourceTooltipInfo[
                                AnnotationSources.MY_CANCER_GENOME
                            ]
                        }
                        legendDescriptions={myCancerGenomeData}
                    />
                }
            >
                <img
                    src={require('../../../../../../src/rootImages/mcg_logo.png')}
                    style={{ height: 14, width: 14, marginLeft: 8 }}
                />
            </DefaultTooltip>
            <DefaultTooltip
                placement="top"
                overlay={
                    <AnnotationHeaderTooltipCard
                        InfoProps={
                            sourceTooltipInfo[AnnotationSources.CANCER_HOTSPOTS]
                        }
                        legendDescriptions={cancerHotspotsData}
                    />
                }
            >
                <img
                    src={require('../../../../../../src/rootImages/cancer-hotspots.svg')}
                    style={{ height: 14, width: 14, marginLeft: 7 }}
                />
            </DefaultTooltip>
        </span>
    );
};

const AnnotationHeaderTooltipCard: React.FunctionComponent<{
    InfoProps: AnnotationHeaderTooltipCardInfoProps[];
    legendDescriptions?: LegendDescription[];
    overrideContent?: JSX.Element;
}> = props => {
    const showLegendTable = !props.overrideContent && props.legendDescriptions;
    return (
        <div style={{ width: 450 }}>
            <AnnotationHeaderTooltipCardInfo infoProps={props.InfoProps} />
            {!!props.overrideContent && props.overrideContent}
            {showLegendTable && (
                <LegendTable legendDescriptions={props.legendDescriptions!} />
            )}
        </div>
    );
};

export default AnnotationHeaderTooltipCard;
