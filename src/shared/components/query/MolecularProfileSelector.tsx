import * as _ from 'lodash';
import * as React from 'react';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import FontAwesome from 'react-fontawesome';
import styles from './styles/styles.module.scss';
import { observer } from 'mobx-react';
import classNames from 'classnames';
import { FlexRow } from '../flexbox/FlexBox';
import { QueryStoreComponent } from './QueryStore';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import SectionHeader from '../sectionHeader/SectionHeader';
import AppConfig from 'appConfig';

@observer
export default class MolecularProfileSelector extends QueryStoreComponent<
    {},
    {}
> {
    private get showGSVA() {
        return AppConfig.serverConfig.skin_show_gsva;
    }

    render() {
        if (this.store.selectableSelectedStudyIds.length !== 1) return null;

        return (
            <FlexRow padded className={styles.MolecularProfileSelector}>
                <SectionHeader
                    className="sectionLabel"
                    promises={[this.store.molecularProfiles]}
                >
                    Select Genomic Profiles:
                </SectionHeader>
                <div
                    className={styles.group}
                    data-test="molecularProfileSelector"
                >
                    {this.renderGroup('MUTATION_EXTENDED', 'Mutation')}
                    {this.renderGroup('COPY_NUMBER_ALTERATION', 'Copy Number')}
                    {this.showGSVA &&
                        this.renderGroup('GENESET_SCORE', 'GSVA scores')}
                    {this.renderGroup('MRNA_EXPRESSION', 'mRNA Expression')}
                    {this.renderGroup('METHYLATION', 'DNA Methylation')}
                    {this.renderGroup('METHYLATION_BINARY', 'DNA Methylation')}
                    {this.renderGroup(
                        'PROTEIN_LEVEL',
                        'Protein/phosphoprotein level'
                    )}
                    {!!(
                        this.store.molecularProfiles.isComplete &&
                        !this.store.molecularProfiles.result.length
                    ) && (
                        <strong>
                            No Genomic Profiles available for this Cancer Study
                        </strong>
                    )}
                </div>
            </FlexRow>
        );
    }

    ProfileToggle = ({
        profile,
        type,
        label,
        checked,
        isGroupToggle,
    }: {
        profile: MolecularProfile;
        type: 'radio' | 'checkbox';
        label: string;
        checked: boolean;
        isGroupToggle: boolean;
    }) => (
        <label>
            <input
                type={type}
                checked={checked}
                onChange={event =>
                    this.store.selectMolecularProfile(
                        profile,
                        (event.target as HTMLInputElement).checked
                    )
                }
                data-test={profile.molecularAlterationType}
            />
            <span
                className={
                    isGroupToggle ? styles.groupName : styles.profileName
                }
            >
                {label}
            </span>
            {!isGroupToggle && (
                <DefaultTooltip
                    mouseEnterDelay={0}
                    placement="right"
                    overlay={
                        <div className={styles.tooltip}>
                            {profile.description}
                        </div>
                    }
                >
                    <FontAwesome
                        className={styles.infoIcon}
                        name="question-circle"
                    />
                </DefaultTooltip>
            )}
        </label>
    );

    renderGroup(
        molecularAlterationType: MolecularProfile['molecularAlterationType'],
        groupLabel: string
    ) {
        let profiles = this.store.getFilteredProfiles(molecularAlterationType);
        if (!profiles.length) return null;

        let groupProfileIds = profiles.map(
            profile => profile.molecularProfileId
        );
        let groupIsSelected =
            _.intersection(this.store.selectedProfileIds, groupProfileIds)
                .length > 0;
        let output: JSX.Element[] = [];

        if (profiles.length > 1 && !this.store.forDownloadTab)
            output.push(
                <this.ProfileToggle
                    key={'altTypeCheckbox:' + molecularAlterationType}
                    profile={profiles[0]}
                    type="checkbox"
                    label={`${groupLabel}. Select one of the profiles below:`}
                    checked={groupIsSelected}
                    isGroupToggle={true}
                />
            );

        let profileToggles = profiles.map(profile => (
            <this.ProfileToggle
                key={'profile:' + profile.molecularProfileId}
                profile={profile}
                type={
                    this.store.forDownloadTab || profiles.length > 1
                        ? 'radio'
                        : 'checkbox'
                }
                label={profile.name}
                checked={_.includes(
                    this.store.selectedProfileIds,
                    profile.molecularProfileId
                )}
                isGroupToggle={false}
            />
        ));

        if (this.store.forDownloadTab || profiles.length == 1)
            output.push(...profileToggles);
        else
            output.push(
                <div
                    key={'group:' + molecularAlterationType}
                    className={styles.group}
                >
                    {profileToggles}
                </div>
            );

        if (this.store.forDownloadTab) return output;

        if (groupIsSelected && molecularAlterationType == 'MRNA_EXPRESSION') {
            output.push(
                <div key={output.length} className={styles.zScore}>
                    Enter a z-score threshold{' '}
                    <span
                        dangerouslySetInnerHTML={{
                            __html: ['&', 'plusmn;'].join(''),
                        }}
                    />
                    <input
                        type="text"
                        value={this.store.zScoreThreshold}
                        onChange={event => {
                            this.store.zScoreThreshold = (event.target as HTMLInputElement).value;
                        }}
                    />
                </div>
            );
        }

        if (groupIsSelected && molecularAlterationType == 'PROTEIN_LEVEL') {
            output.push(
                <div key={output.length} className={styles.zScore}>
                    Enter a z-score threshold{' '}
                    <span
                        dangerouslySetInnerHTML={{
                            __html: ['&', 'plusmn;'].join(''),
                        }}
                    />
                    <input
                        type="text"
                        value={this.store.rppaScoreThreshold}
                        onChange={event => {
                            this.store.rppaScoreThreshold = (event.target as HTMLInputElement).value;
                        }}
                    />
                </div>
            );
        }

        return output;
    }
}
