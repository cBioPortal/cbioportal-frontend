import * as React from 'react';
import { observer } from 'mobx-react';
import Helmet from 'react-helmet';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { PageLayout } from 'shared/components/PageLayout/PageLayout';
import { openSocialAuthWindow } from 'shared/lib/openSocialAuthWindow';
import { getLoadConfig, getServerConfig } from 'config/config';
import { AccountPageStore } from './AccountPageStore';
import VirtualStudiesSection from './VirtualStudiesSection';
import ComparisonGroupsSection from './ComparisonGroupsSection';
import DataAccessTokenSection from './DataAccessTokenSection';
import UserRoleSection from './UserRoleSection';
import styles from './styles.module.scss';

@observer
export default class AccountPage extends React.Component<{}, {}> {
    private store: AccountPageStore;

    private get appStore() {
        return getBrowserWindow().globalStores.appStore;
    }

    constructor(props: any) {
        super(props);
        this.store = new AccountPageStore();
    }

    public render() {
        return (
            <PageLayout className={'whiteBackground'}>
                <div className={styles.accountPage}>
                    <Helmet>
                        <title>
                            {'cBioPortal for Cancer Genomics::My Account'}
                        </title>
                    </Helmet>

                    <h1>My Account</h1>
                    {this.appStore.isLoggedIn ? (
                        <p className={styles.subtext}>
                            Signed in as {this.appStore.userName}
                        </p>
                    ) : (
                        <div className={styles.subtext}>
                            <p>Not logged in.</p>
                            {!getLoadConfig().hide_login &&
                                !getServerConfig().skin_hide_logout_button &&
                                this.appStore.isSocialAuthenticated && (
                                    <button
                                        className="btn btn-default btn-sm"
                                        onClick={() =>
                                            openSocialAuthWindow(this.appStore)
                                        }
                                    >
                                        Login
                                    </button>
                                )}
                        </div>
                    )}

                    <div className={styles.sectionGrid}>
                        <VirtualStudiesSection
                            virtualStudies={this.store.virtualStudies}
                        />
                        <ComparisonGroupsSection
                            comparisonGroups={this.store.comparisonGroups}
                        />
                        <DataAccessTokenSection
                            supported={this.store.dataAccessTokenSupported}
                            dataAccessTokens={this.store.dataAccessTokens}
                        />
                        <UserRoleSection
                            userRoleStore={this.store.userRoleStore}
                        />
                    </div>
                </div>
            </PageLayout>
        );
    }
}
