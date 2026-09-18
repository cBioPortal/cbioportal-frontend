import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, makeObservable } from 'mobx';
import { Modal } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';
import { getServerConfig } from 'config/config';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { FeatureFlagStore } from 'shared/FeatureFlagStore';
import {
    FeatureFlagEnum,
    getFeatureFlagDisplayInfo,
    isFeatureFlagOptable,
    isFeatureFlagRelevantForStudies,
    isFeatureFlagStudySpecific,
} from 'shared/featureFlags';
import {
    RECENT_RELEASES,
    RecentRelease,
    isRecentReleaseVisible,
} from 'shared/recentReleases';
import { FeatureFlagsModalStore } from './FeatureFlagsModalStore';
import styles from './styles.module.scss';

export interface IFeatureFlagsModalProps {
    featureFlagStore: FeatureFlagStore;
    onHide: () => void;
}

type ModalItem =
    | { kind: 'flag'; id: string; flag: FeatureFlagEnum }
    | { kind: 'release'; id: string; release: RecentRelease };

@observer
export default class FeatureFlagsModal extends React.Component<
    IFeatureFlagsModalProps,
    {}
> {
    private store = new FeatureFlagsModalStore();
    @observable.ref private _selectedId: string | undefined;

    constructor(props: IFeatureFlagsModalProps) {
        super(props);
        makeObservable(this);
    }

    private toggle(flag: string, enabled: boolean) {
        if (enabled) {
            this.props.featureFlagStore.remove(flag);
        } else {
            this.props.featureFlagStore.add(flag);
        }
    }

    @action.bound
    private selectItem(id: string) {
        this._selectedId = id;
    }

    private get visibleFlags(): FeatureFlagEnum[] {
        const appName = getServerConfig().app_name;
        const { accessibleStudyIds } = this.store;
        return Object.values(FeatureFlagEnum).filter(flag => {
            const { alwaysOn } = getFeatureFlagDisplayInfo(flag, appName);
            if (!(alwaysOn || isFeatureFlagOptable(flag, appName))) {
                return false;
            }
            if (isFeatureFlagStudySpecific(flag)) {
                if (accessibleStudyIds.isPending) {
                    return false;
                }
                return isFeatureFlagRelevantForStudies(
                    flag,
                    accessibleStudyIds.result!
                );
            }
            return true;
        });
    }

    private get visibleReleases(): RecentRelease[] {
        const appName = getServerConfig().app_name;
        return RECENT_RELEASES.filter(release =>
            isRecentReleaseVisible(release, appName)
        );
    }

    private get visibleItems(): ModalItem[] {
        return [
            ...this.visibleFlags.map(
                (flag): ModalItem => ({ kind: 'flag', id: flag, flag })
            ),
            ...this.visibleReleases.map(
                (release): ModalItem => ({
                    kind: 'release',
                    id: release.id,
                    release,
                })
            ),
        ];
    }

    private itemCategory(item: ModalItem): string {
        const appName = getServerConfig().app_name;
        return item.kind === 'flag'
            ? getFeatureFlagDisplayInfo(item.flag, appName).category
            : item.release.category;
    }

    private itemTitle(item: ModalItem): string {
        const appName = getServerConfig().app_name;
        return item.kind === 'flag'
            ? getFeatureFlagDisplayInfo(item.flag, appName).title
            : item.release.title;
    }

    private get selectedItem(): ModalItem | undefined {
        const items = this.visibleItems;
        return items.find(item => item.id === this._selectedId) ?? items[0];
    }

    private get groupedVisibleItems(): {
        category: string;
        items: ModalItem[];
    }[] {
        const groups: { category: string; items: ModalItem[] }[] = [];
        this.visibleItems.forEach(item => {
            const category = this.itemCategory(item);
            let group = groups.find(g => g.category === category);
            if (!group) {
                group = { category, items: [] };
                groups.push(group);
            }
            group.items.push(item);
        });
        return groups;
    }

    private renderFlagDetail(flag: FeatureFlagEnum) {
        const appName = getServerConfig().app_name;
        const { featureFlagStore } = this.props;
        const enabled = featureFlagStore.has(flag);
        const {
            title,
            description,
            exampleUrl,
            alwaysOn,
        } = getFeatureFlagDisplayInfo(flag, appName);
        const optable = isFeatureFlagOptable(flag, appName);

        return (
            <div className={styles.detail}>
                <div className={styles.detailHeader}>
                    <div>
                        <h4>{title}</h4>
                    </div>
                    {optable ? (
                        <a
                            className={styles.switchLabel}
                            onClick={() => this.toggle(flag, enabled)}
                        >
                            <FontAwesome
                                name={enabled ? 'toggle-on' : 'toggle-off'}
                            />{' '}
                            {enabled ? 'On' : 'Off'}
                        </a>
                    ) : (
                        <span className={styles.badge}>
                            Always on for this portal
                        </span>
                    )}
                </div>
                <p className={styles.subtext}>
                    {description}
                    {alwaysOn && optable && (
                        <span>
                            {' '}
                            Already enabled by default for this portal.
                        </span>
                    )}
                </p>
                {exampleUrl && (
                    <div className={styles.meta}>
                        <a href={exampleUrl}>See an example</a>
                    </div>
                )}
            </div>
        );
    }

    private renderReleaseDetail(release: RecentRelease) {
        const appName = getServerConfig().app_name;
        return (
            <div className={styles.detail}>
                <div className={styles.detailHeader}>
                    <div>
                        <h4>{release.title}</h4>
                    </div>
                    <span className={styles.badge}>Recently released</span>
                </div>
                <p className={styles.subtext}>{release.description}</p>
                <div className={styles.meta}>
                    <a href={release.getUrl(appName)} target="_blank">
                        Open <FontAwesome name="external-link" />
                    </a>
                    {release.secondaryLink && (
                        <>
                            {' · '}
                            <a href={release.secondaryLink.url} target="_blank">
                                {release.secondaryLink.label}
                            </a>
                        </>
                    )}
                </div>
            </div>
        );
    }

    private renderDetail(item: ModalItem) {
        return item.kind === 'flag'
            ? this.renderFlagDetail(item.flag)
            : this.renderReleaseDetail(item.release);
    }

    render() {
        const { featureFlagStore, onHide } = this.props;
        const groups = this.groupedVisibleItems;
        const selected = this.selectedItem;
        const isLoading = this.store.accessibleStudyIds.isPending;

        return (
            <Modal onHide={onHide} show={true}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesome name="flask" /> Experimental Features
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className={styles.subtext}>
                        Get early access to features we're still working on, and
                        see what's recently launched. See our{' '}
                        <a
                            href="https://about.cbioportal.org/roadmap"
                            target="_blank"
                        >
                            roadmap
                        </a>{' '}
                        for what's coming next.
                    </p>
                    {isLoading ? (
                        <LoadingIndicator isLoading={true} />
                    ) : (
                        <div className={styles.layout}>
                            <ul className={styles.sidebar}>
                                {groups.map(group => (
                                    <React.Fragment key={group.category}>
                                        <li className={styles.categoryHeader}>
                                            {group.category}
                                        </li>
                                        {group.items.map(item => (
                                            <li
                                                key={item.id}
                                                className={classNames({
                                                    [styles.selected]:
                                                        selected &&
                                                        item.id === selected.id,
                                                })}
                                                onClick={() =>
                                                    this.selectItem(item.id)
                                                }
                                            >
                                                <FontAwesome
                                                    name={
                                                        item.kind === 'flag'
                                                            ? featureFlagStore.has(
                                                                  item.flag
                                                              )
                                                                ? 'toggle-on'
                                                                : 'toggle-off'
                                                            : 'star'
                                                    }
                                                />{' '}
                                                {this.itemTitle(item)}
                                            </li>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </ul>
                            {selected && this.renderDetail(selected)}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        );
    }
}
