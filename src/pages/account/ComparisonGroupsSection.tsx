import * as React from 'react';
import { observer } from 'mobx-react';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { Group } from 'shared/api/session-service/sessionServiceModels';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { getStudySummaryUrl } from 'shared/api/urls';
import styles from './styles.module.scss';

interface IComparisonGroupsSectionProps {
    comparisonGroups: MobxPromise<Group[]>;
}

@observer
export default class ComparisonGroupsSection extends React.Component<
    IComparisonGroupsSectionProps,
    {}
> {
    render() {
        const { comparisonGroups } = this.props;
        return (
            <div className={styles.card}>
                <h4>Comparison Groups</h4>
                {comparisonGroups.isPending && (
                    <LoadingIndicator isLoading={true} />
                )}
                {!comparisonGroups.isPending &&
                    (comparisonGroups.result!.length === 0 ? (
                        <p className={styles.subtext}>
                            You have no saved comparison groups.
                        </p>
                    ) : (
                        <ul className={styles.itemList}>
                            {comparisonGroups.result!.map(group => (
                                <li key={group.id}>
                                    <a
                                        href={getStudySummaryUrl(
                                            group.data.studies.map(s => s.id)
                                        )}
                                    >
                                        {group.data.name || group.id}
                                    </a>
                                    {group.data.description && (
                                        <div className={styles.subtext}>
                                            {group.data.description}
                                        </div>
                                    )}
                                    <div className={styles.meta}>
                                        {group.data.studies.length} studies
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ))}
            </div>
        );
    }
}
