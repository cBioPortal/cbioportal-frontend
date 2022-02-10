import _ from 'lodash';
import { DefaultTooltip, ICache } from 'cbioportal-frontend-commons';
import { ArticleAbstract, IndicatorQueryTreatment } from 'oncokb-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';
import ReactTable from 'react-table';

import { getTumorTypeName } from '../../util/OncoKbUtils';
import OncoKbHelper from './OncoKbHelper';
import { EvidenceReferenceContent } from './oncokbCard/EvidenceReferenceContent';

import mainStyles from './main.module.scss';
import './oncoKbTreatmentTable.scss';
import request from 'superagent';

console.log('override', localStorage.getItem('frontendConfig'));

let cancerdrugsUrl = localStorage.getItem('cancerdrugsUrl') || '';
let cancerdrugsJsonUrl = localStorage.getItem('cancerdrugsJsonUrl') || '';

type OncoKbTreatmentTableProps = {
    variant: string;
    treatments: IndicatorQueryTreatment[];
    pmidData: ICache<any>;
};

type EmaDrugInfo = {
    infoAvailable: boolean;
    activeSubstance: string;
    conditionIndication: string;
    authorisationDate: string;
    authorisationHolder: string;
    medicineName: string;
    url: string;
};

interface DrugInfo {
    [key: string]: [EmaDrugInfo];
}

type OncoKbTreatmentTableState = {
    drugInfos: DrugInfo;
};

@observer
export default class OncoKbTreatmentTable extends React.Component<
    OncoKbTreatmentTableProps,
    OncoKbTreatmentTableState
> {
    constructor(props: OncoKbTreatmentTableProps) {
        super(props);
        this.state = {
            drugInfos: new Object() as DrugInfo,
        };
        this.props.treatments.map(treatment =>
            treatment.drugs.map(drug => this.promiseDrugInfo(drug.drugName))
        );
    }

    levelTooltipContent = (level: string) => {
        return (
            <div style={{ maxWidth: '200px' }}>
                {OncoKbHelper.LEVEL_DESC[level]}
            </div>
        );
    };

    treatmentTooltipContent = (
        abstracts: ArticleAbstract[],
        pmids: number[],
        pmidData: ICache<any>,
        description?: string
    ) => {
        return abstracts.length > 0 || pmids.length > 0 ? (
            () => (
                <div className={mainStyles['tooltip-refs']}>
                    <EvidenceReferenceContent
                        description={description}
                        citations={{
                            pmids: pmids.map(pmid => pmid.toString()),
                            abstracts: abstracts,
                        }}
                        pmidData={pmidData}
                        noInfoDisclaimer={
                            'Mutation effect information is not available.'
                        }
                    />
                </div>
            )
        ) : (
            <span />
        );
    };

    promiseDrugInfo = (drug: string) =>
        new Promise<EmaDrugInfo>((resolve, reject) => {
            request
                .get(cancerdrugsJsonUrl + drug.replace(' ', '_') + '.json')
                .end((err, res) => {
                    if (!err && res.ok) {
                        const response = JSON.parse(res.text);
                        const emaEpar = response.emaEpar;
                        if (emaEpar.length === 0) {
                            const emaInfo = {
                                infoAvailable: false,
                            } as EmaDrugInfo;
                            this.setState({
                                drugInfos: _.extend(this.state.drugInfos, {
                                    [drug]: [emaInfo],
                                }),
                            });
                        } else {
                            const emaInfos = new Array<EmaDrugInfo>();
                            emaEpar.map((emaEparEntry: any) => {
                                const emaInfo = {
                                    infoAvailable: true,
                                    activeSubstance:
                                        emaEparEntry.activeSubstance,
                                    conditionIndication:
                                        emaEparEntry.conditionIndication,
                                    authorisationDate:
                                        emaEparEntry.marketingAuthorisationDate,
                                    authorisationHolder:
                                        emaEparEntry.marketingAuthorisationHolder,
                                    medicineName: emaEparEntry.medicineName,
                                    url: emaEparEntry.url,
                                } as EmaDrugInfo;
                                emaInfos.push(emaInfo);
                            });
                            this.setState({
                                drugInfos: _.extend(this.state.drugInfos, {
                                    [drug]: emaInfos,
                                }),
                            });
                        }
                    } else {
                        this.setState({
                            drugInfos: _.extend(this.state.drugInfos, {
                                [drug]: [],
                            }),
                        });
                    }
                });
        });

    emaTooltipStyle = (drugName: string) => {
        const drugInfo = this.state.drugInfos[drugName];
        if (!drugInfo) {
            return 'fa fa-spinner fa-spin fa-lg';
        } else if (drugInfo.length < 1) {
            return 'fa fa-eur text-muted fa-lg';
        } else if (!drugInfo[0].infoAvailable) {
            return 'fa fa-eur text-danger fa-lg';
        } else {
            return 'fa fa-eur text-primary fa-lg';
        }
    };

    emaTooltipContent = (drugName: string) => {
        const drugInfo = this.state.drugInfos[drugName];
        if (!drugInfo) {
            return (
                <div style={{ maxWidth: '400px' }}>
                    Getting EMA information...
                </div>
            );
        } else if (drugInfo.length < 1) {
            return (
                <div style={{ maxWidth: '400px' }}>
                    No entry found in cancerdrugs. <br />
                    <a href={cancerdrugsUrl} target={'_blank'}>
                        Search on cancerdrugs
                    </a>
                </div>
            );
        } else if (!drugInfo[0].infoAvailable) {
            return (
                <div style={{ maxWidth: '400px' }}>
                    {drugName} is <b>not</b> authorized in the EU. <br />
                    <a
                        href={cancerdrugsUrl + '/drugs/' + drugName}
                        target={'_blank'}
                    >
                        More info on cancerdrugs
                    </a>
                </div>
            );
        } else {
            return (
                <div style={{ maxWidth: '400px' }}>
                    {drugInfo.map(drugInfoEntry =>
                        this.emaTooltipEntry(drugName, drugInfoEntry)
                    )}
                    <a
                        href={cancerdrugsUrl + '/drugs/' + drugName}
                        target={'_blank'}
                    >
                        More info on cancerdrugs
                    </a>
                </div>
            );
        }
    };

    emaTooltipEntry = (drugName: string, drugInfo: EmaDrugInfo) => {
        return (
            <span>
                {drugName} is authorized in the EU under the name of{' '}
                {drugInfo.medicineName} since{' '}
                {drugInfo.authorisationDate.split(' ')[0]} by{' '}
                {drugInfo.authorisationHolder} (
                <a href={drugInfo.url} target={'_blank'}>
                    more info
                </a>
                ). <br />
                Authorized indication: {drugInfo.conditionIndication} <br />
            </span>
        );
    };

    readonly columns = [
        OncoKbHelper.getDefaultColumnDefinition('level'),
        {
            ...OncoKbHelper.getDefaultColumnDefinition('alterations'),
            Cell: (props: { value: string[] }) => {
                return OncoKbHelper.getAlterationsColumnCell(
                    props.value,
                    this.props.variant
                );
            },
        },
        {
            id: 'treatment',
            Header: <span>Drug(s)</span>,
            accessor: 'drugs',
            Cell: (props: { original: IndicatorQueryTreatment }) => (
                <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                    {/* {props.original.drugs
                        .map(drug => drug.drugName && this.promiseDrugInfo(drug.drugName))
                        .join(' + ')} */}
                    {props.original.drugs.map(drug => (
                        <div>
                            <span style={{ marginRight: '5px' }}>
                                {drug.drugName}
                            </span>
                            <DefaultTooltip
                                placement="left"
                                trigger={['hover', 'focus']}
                                overlay={
                                    <div>
                                        {this.emaTooltipContent(drug.drugName)}
                                    </div>
                                }
                                destroyTooltipOnHide={true}
                            >
                                <i
                                    className={this.emaTooltipStyle(
                                        drug.drugName
                                    )}
                                ></i>
                            </DefaultTooltip>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            id: 'cancerType',
            Header: (
                <span>
                    Level-associated
                    <br />
                    cancer type(s)
                </span>
            ),
            accessor: 'levelAssociatedCancerType',
            minWidth: 120,
            Cell: (props: { original: IndicatorQueryTreatment }) => (
                <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                    {getTumorTypeName(props.original.levelAssociatedCancerType)}
                </div>
            ),
        },
        {
            id: 'referenceList',
            Header: <span />,
            sortable: false,
            maxWidth: 25,
            Cell: (props: { original: IndicatorQueryTreatment }) =>
                (props.original.abstracts.length > 0 ||
                    props.original.pmids.length > 0) && (
                    <DefaultTooltip
                        overlay={this.treatmentTooltipContent(
                            props.original.abstracts,
                            props.original.pmids.map(pmid => Number(pmid)),
                            this.props.pmidData,
                            props.original.description
                        )}
                        placement="right"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <i className="fa fa-book" />
                    </DefaultTooltip>
                ),
        },
    ];

    public render() {
        return (
            <div className="oncokb-treatment-table">
                <ReactTable
                    data={this.props.treatments}
                    columns={this.columns}
                    showPagination={false}
                    pageSize={this.props.treatments.length}
                    className="-striped -highlight"
                />
            </div>
        );
    }
}
