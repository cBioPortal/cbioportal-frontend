import * as React from 'react';
import { If, Then, Else } from 'react-if';
import { observer } from 'mobx-react';
import * as _ from 'lodash';
import {
    ITherapyRecommendation,
    ITreatment,
    IGeneticAlteration,
    IReference,
    IClinicalData,
    EvidenceLevel,
} from '../../../shared/model/TherapyRecommendation';
import { computed, makeObservable, observable } from 'mobx';
import LazyMobXTable from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import styles from './style/therapyRecommendation.module.scss';
import SampleManager from '../SampleManager';
import {
    DefaultTooltip,
    placeArrowBottomLeft,
} from 'cbioportal-frontend-commons';
import {
    truncate,
    getNewTherapyRecommendation,
    setAuthorInTherapyRecommendation,
    isTherapyRecommendationEmpty,
    flattenObject,
    flattenArray,
    getTooltipEvidenceContent,
    getTooltipAuthorContent,
} from './TherapyRecommendationTableUtils';
import { Button } from 'react-bootstrap';
import {
    Mutation,
    ClinicalData,
    DiscreteCopyNumberData,
} from 'cbioportal-ts-api-client';
import TherapyRecommendationForm from './form/TherapyRecommendationForm';
import { RemoteData, IOncoKbData } from 'cbioportal-utils';
import TherapyRecommendationFormOncoKb from './form/TherapyRecommendationFormOncoKb';
import PubMedCache from 'shared/cache/PubMedCache';
import { VariantAnnotation, MyVariantInfo } from 'genome-nexus-ts-api-client';
import { IMutationalSignature } from 'shared/model/MutationalSignature';
import { getServerConfig } from 'config/config';

export type ITherapyRecommendationProps = {
    patientId: string;
    mutations: Mutation[];
    indexedVariantAnnotations:
        | { [genomicLocation: string]: VariantAnnotation }
        | undefined;
    indexedMyVariantInfoAnnotations:
        | { [genomicLocation: string]: MyVariantInfo }
        | undefined;
    cna: DiscreteCopyNumberData[];
    clinicalData: ClinicalData[];
    mutationSignatureData: _.Dictionary<IMutationalSignature[]>;
    sampleManager: SampleManager | null;
    oncoKbAvailable: boolean;
    therapyRecommendations: ITherapyRecommendation[];
    containerWidth: number;
    onDelete: (therapyRecommendation: ITherapyRecommendation) => boolean;
    onAddOrEdit: (therapyRecommendation?: ITherapyRecommendation) => boolean;
    onReposition: (
        therapyRecommendation: ITherapyRecommendation,
        newIndex: number
    ) => boolean;
    oncoKbData?: RemoteData<IOncoKbData | Error | undefined>;
    cnaOncoKbData?: RemoteData<IOncoKbData | Error | undefined>;
    pubMedCache?: PubMedCache;
    isDisabled: boolean;
};

export type ITherapyRecommendationState = {
    therapyRecommendations: ITherapyRecommendation[];
};

enum ColumnKey {
    PRIO = 'Prio',
    THERAPY = 'Therapy',
    COMMENT = 'Comment',
    REASONING = 'Reasoning',
    REFERENCES = 'References',
    EVIDENCE = 'Evidence Level',
    EDIT = 'Edit',
}

enum ColumnWidth {
    PRIO = 30,
    THERAPY = 140,
    COMMENT = 340,
    REASONING = 240,
    REFERENCES = 140,
    EVIDENCE = 20,
    EDIT = 60,
}

class TherapyRecommendationTableComponent extends LazyMobXTable<
    ITherapyRecommendation
> {}

@observer
export default class MtbTherapyRecommendationTable extends React.Component<
    ITherapyRecommendationProps,
    ITherapyRecommendationState
> {
    constructor(props: ITherapyRecommendationProps) {
        super(props);
        this.state = {
            therapyRecommendations: props.therapyRecommendations,
        };
        makeObservable(this);
    }

    @computed
    get columnWidths() {
        return {
            [ColumnKey.COMMENT]: ColumnWidth.COMMENT,
            // [ColumnKey.COMMENT]: 1 * (this.props.containerWidth - ColumnWidth.ID),
            //[ColumnKey.MATCHING_CRITERIA]: 0.65 * (this.props.containerWidth - ColumnWidth.ID)
        };
    }

    @observable selectedTherapyRecommendation:
        | ITherapyRecommendation
        | undefined;
    @observable backupTherapyRecommendation: ITherapyRecommendation | undefined;
    @observable showOncoKBForm: boolean;

    private _columns = [
        {
            name: ColumnKey.PRIO,
            render: (therapyRecommendation: ITherapyRecommendation) => (
                <div className={styles.editContainer}>
                    <span className={styles.edit}>
                        <Button
                            type="button"
                            className={'btn ' + styles.repositionButton}
                            disabled={
                                this.props.isDisabled ||
                                this.findIndex(therapyRecommendation) <= 0
                            }
                            onClick={() =>
                                this.props.onReposition(
                                    therapyRecommendation,
                                    this.findIndex(therapyRecommendation) - 1
                                )
                            }
                        >
                            <i
                                className={`fa fa-arrow-up fa-lg`}
                                aria-hidden="true"
                            ></i>{' '}
                        </Button>
                    </span>
                    <span className={styles.edit}>
                        <Button
                            type="button"
                            className={'btn ' + styles.repositionButton}
                            disabled={
                                this.props.isDisabled ||
                                this.findIndex(therapyRecommendation) >=
                                    this.props.therapyRecommendations.length - 1
                            }
                            onClick={() =>
                                this.props.onReposition(
                                    therapyRecommendation,
                                    this.findIndex(therapyRecommendation) + 1
                                )
                            }
                        >
                            <i
                                className={`fa fa-arrow-down fa-lg`}
                                aria-hidden="true"
                            ></i>{' '}
                        </Button>
                    </span>
                </div>
            ),
            //width: this.columnWidths[ColumnKey.PRIO],
        },
        {
            name: ColumnKey.REASONING,
            render: (therapyRecommendation: ITherapyRecommendation) => (
                <div>
                    <div className={styles.reasoningInfoContainer}>
                        <div className={styles.genomicInfoContainer}>
                            <div className={styles.reasoningContainer}>
                                <If
                                    condition={
                                        therapyRecommendation.reasoning
                                            .geneticAlterations &&
                                        therapyRecommendation.reasoning
                                            .geneticAlterations.length > 0
                                    }
                                >
                                    <div className={styles.firstLeft}>
                                        <div className={styles.secondLeft}>
                                            Genomic alterations:
                                            <div>
                                                {therapyRecommendation.reasoning
                                                    .geneticAlterations &&
                                                    this.getGeneticAlterations(
                                                        therapyRecommendation
                                                            .reasoning
                                                            .geneticAlterations
                                                    )}
                                            </div>
                                            In samples:
                                            <div>
                                                {therapyRecommendation.reasoning
                                                    .geneticAlterations &&
                                                    this.getSamplesForGeneticAlterations(
                                                        therapyRecommendation
                                                            .reasoning
                                                            .geneticAlterations
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </If>
                                <If
                                    condition={
                                        therapyRecommendation.reasoning
                                            .clinicalData &&
                                        therapyRecommendation.reasoning
                                            .clinicalData.length > 0
                                    }
                                >
                                    <div className={styles.firstRight}>
                                        Clinical data / molecular diagnostics:
                                        {therapyRecommendation.reasoning
                                            .clinicalData &&
                                            therapyRecommendation.reasoning.clinicalData.map(
                                                (
                                                    clinicalDataItem: IClinicalData
                                                ) => (
                                                    <div>
                                                        {/* {clinicalDataItem.attribute + ": " + clinicalDataItem.value} */}
                                                        {this.getTextForClinicalDataItem(
                                                            clinicalDataItem
                                                        )}
                                                    </div>
                                                )
                                            )}
                                    </div>
                                </If>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            // width: this.columnWidths[ColumnKey.REASONING]
        },
        {
            name: ColumnKey.THERAPY,
            render: (therapyRecommendation: ITherapyRecommendation) => (
                <If
                    condition={
                        therapyRecommendation.treatments &&
                        therapyRecommendation.treatments.length > 0
                    }
                >
                    <div>
                        <span>
                            {therapyRecommendation.treatments.map(
                                (treatment: ITreatment) => (
                                    <div>
                                        <img
                                            src={require('../../../globalStyles/images/drug.png')}
                                            style={{ width: 18, marginTop: -5 }}
                                            alt="drug icon"
                                        />
                                        <b>{treatment.name}</b>
                                    </div>
                                )
                            )}
                        </span>
                    </div>
                </If>
            ),
            // width: this.columnWidths[ColumnKey.THERAPY]
        },
        {
            name: ColumnKey.COMMENT,
            render: (therapyRecommendation: ITherapyRecommendation) => (
                <div>
                    {therapyRecommendation.comment.map((comment: string) => (
                        <p>{comment}</p>
                    ))}
                </div>
            ),
            width: this.columnWidths[ColumnKey.COMMENT],
        },
        {
            name: ColumnKey.EVIDENCE,
            render: (therapyRecommendation: ITherapyRecommendation) => (
                <div>
                    <span style={{ marginRight: 5 }}>
                        Level{' '}
                        <b>{therapyRecommendation.evidenceLevel || 'NA'}</b>{' '}
                        {therapyRecommendation.evidenceLevelExtension || ''}
                        {therapyRecommendation.evidenceLevelM3Text
                            ? ' (' +
                              therapyRecommendation.evidenceLevelM3Text +
                              ')'
                            : ''}
                    </span>
                    <If condition={therapyRecommendation.evidenceLevel}>
                        <DefaultTooltip
                            //placement="bottomLeft"
                            trigger={['hover', 'focus']}
                            overlay={getTooltipEvidenceContent(
                                therapyRecommendation.evidenceLevel
                            )}
                            destroyTooltipOnHide={false}
                            //onPopupAlign={placeArrowBottomLeft}
                        >
                            <i
                                className={'fa fa-info-circle ' + styles.icon}
                            ></i>
                        </DefaultTooltip>
                    </If>
                </div>
            ),
            // width: this.columnWidths[ColumnKey.EVIDENCE]
        },
        {
            name: ColumnKey.REFERENCES,
            render: (therapyRecommendation: ITherapyRecommendation) => (
                <If
                    condition={
                        therapyRecommendation.references &&
                        therapyRecommendation.references.length > 0
                    }
                >
                    <div>
                        {therapyRecommendation.references.map(
                            (reference: IReference) => (
                                <If
                                    condition={
                                        reference.pmid && reference.pmid > 0
                                    }
                                >
                                    <Then>
                                        <div>
                                            <a
                                                target="_blank"
                                                href={
                                                    'https://www.ncbi.nlm.nih.gov/pubmed/' +
                                                    reference.pmid
                                                }
                                            >
                                                [{reference.pmid}]{' '}
                                                {truncate(
                                                    reference.name,
                                                    40,
                                                    true
                                                )}
                                            </a>
                                        </div>
                                    </Then>
                                    <Else>
                                        <div>
                                            {truncate(
                                                reference.name,
                                                200,
                                                true
                                            )}
                                        </div>
                                    </Else>
                                </If>
                            )
                        )}
                    </div>
                </If>
            ),
            // width: this.columnWidths[ColumnKey.REFERENCES]
        },
        {
            name: ColumnKey.EDIT,
            render: (therapyRecommendation: ITherapyRecommendation) => (
                <div className={styles.editContainer}>
                    <span className={styles.edit}>
                        <DefaultTooltip
                            //placement="bottomLeft"
                            trigger={['hover', 'focus']}
                            overlay={getTooltipAuthorContent(
                                'Therapy Recommendation',
                                therapyRecommendation.author
                            )}
                            destroyTooltipOnHide={false}
                            //onPopupAlign={placeArrowBottomLeft}
                        >
                            <i
                                className={
                                    'fa fa-user-circle ' + styles.editIcon
                                }
                            ></i>
                        </DefaultTooltip>
                    </span>
                    <span className={styles.edit}>
                        <Button
                            type="button"
                            className={'btn btn-default ' + styles.editButton}
                            disabled={this.props.isDisabled}
                            onClick={() =>
                                this.openEditForm(therapyRecommendation)
                            }
                        >
                            <i
                                className={`fa fa-edit ${styles.marginLeft}`}
                                aria-hidden="true"
                            ></i>{' '}
                            Edit
                        </Button>
                    </span>
                    <span className={styles.edit}>
                        <Button
                            type="button"
                            className={'btn btn-default ' + styles.deleteButton}
                            disabled={this.props.isDisabled}
                            onClick={() =>
                                window.confirm(
                                    'Are you sure you wish to delete this item?'
                                ) && this.openDeleteForm(therapyRecommendation)
                            }
                        >
                            <i
                                className={`fa fa-trash ${styles.marginLeft}`}
                                aria-hidden="true"
                            ></i>{' '}
                            Delete
                        </Button>
                    </span>
                </div>
            ),
            // width: this.columnWidths[ColumnKey.EDIT]
        },
    ];

    public getSampleIdIcons(fittingSampleIds: string[]) {
        let sortedSampleIds = fittingSampleIds;
        if (fittingSampleIds.length > 1) {
            const sampleOrder = this.props.sampleManager!.getSampleIdsInOrder();
            sortedSampleIds = sampleOrder.filter((sampleId: string) =>
                fittingSampleIds.includes(sampleId)
            );
        }
        return (
            <React.Fragment>
                {sortedSampleIds.map((sampleId: string) => (
                    <span className={styles.genomicSpan}>
                        {this.props.sampleManager!.getComponentForSample(
                            sampleId,
                            1,
                            ''
                        )}
                    </span>
                ))}
            </React.Fragment>
        );
    }

    private findIndex(therapyRecommendation: ITherapyRecommendation) {
        return this.props.therapyRecommendations.findIndex(
            x => x.id === therapyRecommendation.id
        );
    }

    private getAllAlterationsOfPatient() {
        let allMutations = this.props.mutations.map((mutation: Mutation) => {
            return {
                hugoSymbol: mutation.gene.hugoGeneSymbol,
                alteration: mutation.proteinChange,
                entrezGeneId: mutation.entrezGeneId,
                sampleId: mutation.sampleId,
            };
        });
        let allCna = this.props.cna.map((alt: DiscreteCopyNumberData) => {
            return {
                hugoSymbol: alt.gene.hugoGeneSymbol,
                alteration:
                    alt.alteration === -2 ? 'Deletion' : 'Amplification',
                entrezGeneId: alt.entrezGeneId,
                sampleId: alt.sampleId,
            };
        });
        allMutations.push(...allCna);
        return allMutations;
    }

    public getSamplesForGeneticAlterations(
        geneticAlterations: IGeneticAlteration[]
    ) {
        if (!geneticAlterations || geneticAlterations.length == 0) return;
        let alterationIds = geneticAlterations.map(
            (geneticAlteration: IGeneticAlteration) =>
                (geneticAlteration.entrezGeneId || '') +
                (geneticAlteration.alteration || '')
        );
        let allAlterationsOfPatient = this.getAllAlterationsOfPatient();
        let groupedMutations = _.groupBy(
            allAlterationsOfPatient,
            (alteration: any) => alteration.sampleId
        );
        let fittingSampleIds: string[] = [];
        for (let sampleId in groupedMutations) {
            let allAlterationsOfSample = groupedMutations[sampleId];
            if (
                alterationIds.every((alterationId: string) =>
                    allAlterationsOfSample
                        .map((alt: any) => alt.entrezGeneId + alt.alteration)
                        .includes(alterationId)
                )
            ) {
                fittingSampleIds.push(sampleId);
            }
        }
        return this.getSampleIdIcons(fittingSampleIds);
    }

    public openDeleteForm(therapyRecommendation: ITherapyRecommendation) {
        if (this.props.onDelete(therapyRecommendation))
            this.updateTherapyRecommendationTable();
    }

    public openEditForm(therapyRecommendation: ITherapyRecommendation) {
        this.selectedTherapyRecommendation = therapyRecommendation;
        this.backupTherapyRecommendation = { ...therapyRecommendation };
    }

    public openAddForm() {
        this.selectedTherapyRecommendation = getNewTherapyRecommendation(
            this.props.patientId
        );
    }

    private openAddOncoKbForm() {
        console.group('OncoKB Test');
        console.log('OncoKB Data ' + this.props.oncoKbData!.status);
        console.log(this.props.oncoKbData!.result);
        console.groupEnd();
        this.showOncoKBForm = true;
    }

    public onHideOncoKbForm(
        newTherapyRecommendations?:
            | ITherapyRecommendation
            | ITherapyRecommendation[]
    ) {
        if (!_.isArray(newTherapyRecommendations)) {
            this.showOncoKBForm = false;
            this.selectedTherapyRecommendation = newTherapyRecommendations;
            //this.onHideAddEditForm(newTherapyRecommendations);
        } else {
            newTherapyRecommendations.map(
                (therapyRecommendation: ITherapyRecommendation) =>
                    this.onHideAddEditForm(therapyRecommendation)
            );
        }
    }

    public onHideAddEditForm(
        newTherapyRecommendation?: ITherapyRecommendation
    ) {
        console.group('On hide add edit form');
        console.log(flattenObject(this.selectedTherapyRecommendation));
        console.log(flattenObject(this.backupTherapyRecommendation));
        console.log(newTherapyRecommendation);
        console.log(flattenArray(this.props.therapyRecommendations));
        console.groupEnd();
        this.selectedTherapyRecommendation = undefined;
        if (
            !newTherapyRecommendation ||
            isTherapyRecommendationEmpty(newTherapyRecommendation)
        ) {
            if (this.backupTherapyRecommendation) {
                this.props.onAddOrEdit(undefined);
                this.backupTherapyRecommendation = undefined;
            }
        } else {
            newTherapyRecommendation = setAuthorInTherapyRecommendation(
                newTherapyRecommendation
            );
            this.props.onAddOrEdit(newTherapyRecommendation);
        }
        this.showOncoKBForm = false;
        this.updateTherapyRecommendationTable();
    }

    public updateTherapyRecommendationTable() {
        this.setState({
            therapyRecommendations: this.props.therapyRecommendations,
        });
        // console.group("Updating table");
        // console.log(flattenStringify(this.props.therapyRecommendations));
        // console.groupEnd();
    }

    public getGeneticAlterations(geneticAlterations: IGeneticAlteration[]) {
        return (
            <React.Fragment>
                <If
                    condition={
                        geneticAlterations && geneticAlterations.length > 0
                    }
                >
                    <div>
                        {geneticAlterations &&
                            geneticAlterations.map(
                                (geneticAlteration: IGeneticAlteration) => (
                                    <div>
                                        {geneticAlteration &&
                                            this.getGeneticAlteration(
                                                geneticAlteration
                                            )}
                                    </div>
                                )
                            )}
                    </div>
                </If>
            </React.Fragment>
        );
    }

    public getGeneticAlteration(geneticAlteration: IGeneticAlteration) {
        return (
            <React.Fragment>
                <div>
                    <span style={{ marginRight: 5 }}>
                        <b>{geneticAlteration.hugoSymbol}</b>{' '}
                        {geneticAlteration.alteration || 'any'}
                    </span>
                    <DefaultTooltip
                        placement="bottomLeft"
                        trigger={['hover', 'focus']}
                        overlay={this.tooltipGenomicContent(geneticAlteration)}
                        destroyTooltipOnHide={false}
                        onPopupAlign={placeArrowBottomLeft}
                    >
                        <i className={'fa fa-info-circle ' + styles.icon}></i>
                    </DefaultTooltip>
                </div>
            </React.Fragment>
        );
    }

    private tooltipGenomicContent(geneticAlteration: IGeneticAlteration) {
        return (
            <div className={styles.tooltip}>
                <div>
                    Genomic selection specified in the therapy recommendation:
                </div>
                <div>
                    <b>{geneticAlteration.hugoSymbol}</b> (ID:{' '}
                    {geneticAlteration.entrezGeneId}){' '}
                    {geneticAlteration.alteration || 'any'}
                </div>
            </div>
        );
    }

    private getTextForClinicalDataItem(item: IClinicalData): string {
        let text = '';
        if (item.attributeName) text += item.attributeName;
        if (item.attributeName && item.value) text += ': ';
        if (item.value) text += item.value;
        return text;
    }

    render() {
        return (
            <div>
                <p className={styles.edit}>
                    <Button
                        type="button"
                        className={'btn btn-default ' + styles.addButton}
                        disabled={this.props.isDisabled}
                        onClick={() => this.openAddForm()}
                    >
                        <i
                            className={`fa fa-plus ${styles.marginLeft}`}
                            aria-hidden="true"
                        ></i>{' '}
                        Add
                    </Button>
                    <If condition={this.props.oncoKbAvailable}>
                        <Then>
                            <Button
                                type="button"
                                className={
                                    'btn btn-default ' + styles.addOncoKbButton
                                }
                                disabled={this.props.isDisabled}
                                onClick={() => this.openAddOncoKbForm()}
                            >
                                <i
                                    className={`fa fa-plus ${styles.marginLeft}`}
                                    aria-hidden="true"
                                ></i>{' '}
                                Add from OncoKB
                            </Button>
                        </Then>
                        <Else>
                            <Button
                                type="button"
                                className={
                                    'btn btn-default ' + styles.addOncoKbButton
                                }
                                disabled={true}
                            >
                                <i
                                    className={`fa fa-exclamation-triangle ${styles.marginLeft}`}
                                    aria-hidden="true"
                                ></i>{' '}
                                OncoKB unavailable
                            </Button>
                        </Else>
                    </If>
                    {/* <Button type="button" className={"btn btn-default " + styles.testButton} onClick={() => this.test()}>Test (Update)</Button> */}
                </p>
                {this.selectedTherapyRecommendation && (
                    <TherapyRecommendationForm
                        show={!!this.selectedTherapyRecommendation}
                        data={this.selectedTherapyRecommendation}
                        mutations={this.props.mutations}
                        indexedVariantAnnotations={
                            this.props.indexedVariantAnnotations
                        }
                        indexedMyVariantInfoAnnotations={
                            this.props.indexedMyVariantInfoAnnotations
                        }
                        cna={this.props.cna}
                        clinicalData={this.props.clinicalData}
                        mutationSignatureData={this.props.mutationSignatureData}
                        sampleManager={this.props.sampleManager}
                        onHide={(
                            therapyRecommendation?: ITherapyRecommendation
                        ) => {
                            this.onHideAddEditForm(therapyRecommendation);
                        }}
                        title="Edit therapy recommendation"
                        userEmailAddress={getServerConfig().user_email_address}
                    />
                )}
                {this.showOncoKBForm && (
                    <TherapyRecommendationFormOncoKb
                        show={this.showOncoKBForm}
                        patientID={this.props.patientId}
                        oncoKbResult={this.props.oncoKbData}
                        cnaOncoKbResult={this.props.cnaOncoKbData}
                        pubMedCache={this.props.pubMedCache}
                        mutations={this.props.mutations}
                        indexedVariantAnnotations={
                            this.props.indexedVariantAnnotations
                        }
                        indexedMyVariantInfoAnnotations={
                            this.props.indexedMyVariantInfoAnnotations
                        }
                        cna={this.props.cna}
                        onHide={(
                            therapyRecommendations?:
                                | ITherapyRecommendation
                                | ITherapyRecommendation[]
                        ) => {
                            this.onHideOncoKbForm(therapyRecommendations);
                        }}
                        title="Add therapy recommendation from OncoKB"
                        userEmailAddress={getServerConfig().user_email_address}
                    />
                )}
                <TherapyRecommendationTableComponent
                    data={this.props.therapyRecommendations}
                    columns={this._columns}
                    showCopyDownload={false}
                    // showFilter={false}
                    showColumnVisibility={false}
                />
                {/* <SimpleCopyDownloadControls
                    downloadData={() =>
                        flattenStringify(this.props.therapyRecommendations)
                    }
                    downloadFilename={`TherapyRecommendation_${this.props.patientId}.json`}
                    controlsStyle="BUTTON"
                /> */}
            </div>
        );
    }
}
