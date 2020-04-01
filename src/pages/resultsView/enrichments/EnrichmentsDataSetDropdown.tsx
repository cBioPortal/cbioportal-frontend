import * as React from 'react';
import { observer } from 'mobx-react';
import { computed } from 'mobx';
import styles from './styles.module.scss';
import { MolecularProfile, CancerStudy } from 'cbioportal-ts-api-client';
import autobind from 'autobind-decorator';
import MolecularProfileSelector from '../../../shared/components/MolecularProfileSelector';
import { MobxPromise } from 'mobxpromise';
import * as _ from 'lodash';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

export interface IEnrichmentsDataSetDropdownProps {
    dataSets: MobxPromise<MolecularProfile[]>;
    onChange: (studyMolecularProfileMap: {
        [id: string]: MolecularProfile;
    }) => void;
    selectedProfileByStudyId: {
        [id: string]: Pick<MolecularProfile, 'molecularProfileId'>;
    };
    molecularProfileIdToProfiledSampleCount?: MobxPromise<{
        [molecularProfileId: string]: number;
    }>;
    studies: CancerStudy[];
    alwaysShow?: boolean;
}

@observer
export default class EnrichmentsDataSetDropdown extends React.Component<
    IEnrichmentsDataSetDropdownProps,
    {}
> {
    @autobind
    private change(selectedStudyId: string, o: any) {
        // at this point, we know dataSets is complete because otherwise this callback wouldnt be fired
        let updatedStudyMolecularProfileMap = _.mapValues(
            this.props.selectedProfileByStudyId,
            (molecularProfile, studyId) => {
                if (selectedStudyId === studyId) {
                    return this.molecularProfileMap[o.value];
                }
                return this.molecularProfileMap[
                    molecularProfile.molecularProfileId
                ];
            }
        );
        // only update if the options are changed
        if (
            !_.isEqual(
                this.props.selectedProfileByStudyId,
                updatedStudyMolecularProfileMap
            )
        ) {
            this.props.onChange(updatedStudyMolecularProfileMap);
        }
    }

    @computed private get molecularProfileMap() {
        if (this.props.dataSets.isComplete) {
            return _.keyBy(
                this.props.dataSets.result!,
                x => x.molecularProfileId
            );
        }
        return {};
    }

    @computed private get studiesMap() {
        return _.keyBy(this.props.studies, x => x.studyId);
    }

    @computed private get showEnrichmentsDataSetDropdown() {
        if (this.props.dataSets.isComplete) {
            let molecularProfilesMap = _.groupBy(
                this.props.dataSets.result!,
                profile => profile.studyId
            );
            return !!_.find(
                molecularProfilesMap,
                molecularProfiles => molecularProfiles.length > 1
            );
        }
        return false;
    }

    public render() {
        if (
            this.props.dataSets.isPending ||
            (this.props.molecularProfileIdToProfiledSampleCount &&
                this.props.molecularProfileIdToProfiledSampleCount.isPending)
        ) {
            return <LoadingIndicator isLoading={true} />;
        }
        if (this.showEnrichmentsDataSetDropdown || !!this.props.alwaysShow) {
            let studyProfilesMap = _.groupBy(
                this.props.dataSets.result!,
                x => x.studyId
            );
            const includeStudyName = Object.keys(studyProfilesMap).length > 1;
            return _.map(studyProfilesMap, (molecularProfiles, studyId) => (
                <div className={styles.DataSet}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <strong>
                            {includeStudyName
                                ? this.studiesMap[studyId].name + ' '
                                : ''}
                            Data Set:
                        </strong>
                        <div
                            style={{
                                display: 'inline-block',
                                marginLeft: 5,
                                width: 400,
                            }}
                        >
                            <MolecularProfileSelector
                                value={
                                    this.props.selectedProfileByStudyId[studyId]
                                        .molecularProfileId
                                }
                                molecularProfiles={molecularProfiles}
                                molecularProfileIdToProfiledSampleCount={
                                    this.props
                                        .molecularProfileIdToProfiledSampleCount
                                        ? this.props
                                              .molecularProfileIdToProfiledSampleCount
                                              .result
                                        : undefined
                                }
                                onChange={(o: any) => this.change(studyId, o)}
                            />
                        </div>
                    </div>
                </div>
            ));
        }
        return null;
    }
}
