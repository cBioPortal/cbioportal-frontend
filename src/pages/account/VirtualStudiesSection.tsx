import * as React from 'react';
import { observer } from 'mobx-react';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { VirtualStudy } from 'shared/api/session-service/sessionServiceModels';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { getStudySummaryUrl } from 'shared/api/urls';
import styles from './styles.module.scss';

interface IVirtualStudiesSectionProps {
    virtualStudies: MobxPromise<VirtualStudy[]>;
}

@observer
export default class VirtualStudiesSection extends React.Component<
    IVirtualStudiesSectionProps,
    {}
> {
    render() {
        const { virtualStudies } = this.props;
        return (
            <div className={styles.card}>
                <h4>Saved Virtual Studies</h4>
                {virtualStudies.isPending && (
                    <LoadingIndicator isLoading={true} />
                )}
                {!virtualStudies.isPending &&
                    (virtualStudies.result!.length === 0 ? (
                        <p className={styles.subtext}>
                            You have no saved virtual studies.
                        </p>
                    ) : (
                        <ul className={styles.itemList}>
                            {virtualStudies.result!.map(vs => {
                                const sampleCount = vs.data.studies.reduce(
                                    (sum, s) => sum + s.samples.length,
                                    0
                                );
                                return (
                                    <li key={vs.id}>
                                        <a href={getStudySummaryUrl(vs.id)}>
                                            {vs.data.name || vs.id}
                                        </a>
                                        {vs.data.description && (
                                            <div className={styles.subtext}>
                                                {vs.data.description}
                                            </div>
                                        )}
                                        <div className={styles.meta}>
                                            {vs.data.studies.length} studies,{' '}
                                            {sampleCount} samples
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ))}
            </div>
        );
    }
}
