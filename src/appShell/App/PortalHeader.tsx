import * as React from 'react';
import _ from 'lodash';
import { Link, NavLink } from 'react-router-dom';
import { If, Then, Else } from 'react-if';
import { AppStore } from '../../AppStore';
import { observer } from 'mobx-react';
import { observable, makeObservable, action } from 'mobx';
import {
    getcBioPortalLogoUrl,
    getInstituteLogoUrl,
} from '../../shared/api/urls';
import SocialAuthButton from '../../shared/components/SocialAuthButton';
import { Dropdown } from 'react-bootstrap';
import { DataAccessTokensDropdown } from '../../shared/components/dataAccessTokens/DataAccessTokensDropdown';
import { getLoadConfig, getServerConfig } from 'config/config';
import FontAwesome from 'react-fontawesome';
import { FeatureFlagEnum } from 'shared/featureFlags';

@observer
export default class PortalHeader extends React.Component<
    { appStore: AppStore },
    {}
> {
    @observable private datDropdownOpen = false;
    private _justClosedByRootClose = false;

    constructor(props: { appStore: AppStore }) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private handleDatDropdownToggle(
        isOpen: boolean,
        _event?: any,
        eventDetails?: { source: string }
    ) {
        // rootCloseEvent="mousedown" prevents the open-then-close race condition,
        // but when clicking the toggle to close, mousedown fires rootClose (close)
        // followed by click firing handleClick (reopen). Guard against that reopen.
        if (!isOpen && eventDetails?.source === 'rootClose') {
            this._justClosedByRootClose = true;
            setTimeout(() => {
                this._justClosedByRootClose = false;
            }, 0);
        }
        if (isOpen && this._justClosedByRootClose) {
            return;
        }
        this.datDropdownOpen = isOpen;
    }

    private tabs() {
        return [
            {
                id: 'datasets',
                text: 'Data Sets',
                address: '/datasets',
                internal: true,
                hide: () => getServerConfig().skin_show_data_tab === false,
            },

            {
                id: 'webAPI',
                text: 'Web API',
                address: 'https://docs.cbioportal.org/web-api-and-clients/',
                internal: false,
                hide: () => getServerConfig().skin_show_web_api_tab === false,
            },

            {
                id: 'rMatlab',
                text: 'R/MATLAB',
                address: '/rmatlab',
                internal: true,
                hide: () => getServerConfig().skin_show_r_matlab_tab === false,
            },

            {
                id: 'tutorials',
                text: 'Tutorials/Webinars',
                address: 'https://docs.cbioportal.org/user-guide/overview/',
                internal: false,
                hide: () => getServerConfig().skin_show_tutorials_tab === false,
            },

            {
                id: 'faq',
                text: 'FAQ',
                address: 'https://docs.cbioportal.org/user-guide/faq/',
                internal: false,
                hide: () => getServerConfig().skin_show_faqs_tab === false,
            },

            {
                id: 'news',
                text: 'News',
                address: getServerConfig().skin_documentation_news!,
                internal: false,
                hide: () => getServerConfig().skin_show_news_tab === false,
            },

            {
                id: 'visualize',
                text: 'Visualize Your Data',
                address: '/visualize',
                internal: true,
                hide: () => getServerConfig().skin_show_tools_tab === false,
            },

            {
                id: 'about',
                text: 'About',
                address: 'https://about.cbioportal.org/',
                internal: false,
                hide: () => getServerConfig().skin_show_about_tab === false,
            },

            {
                id: 'roadmap',
                text: 'Roadmap',
                address: 'https://about.cbioportal.org/roadmap',
                internal: false,
                hide: () => getServerConfig().skin_show_roadmap_tab === false,
            },

            {
                id: 'installation-map',
                text: 'cBioPortal Installations',
                address: '/installations',
                internal: false,
                hide: () => !getServerConfig().installation_map_url,
            },

            {
                id: 'chat',
                text: (
                    <>
                        Chat <strong className={'beta-text'}>Beta!</strong>
                    </>
                ),
                address:
                    getServerConfig().app_name === 'mskcc-portal'
                        ? 'https://chat.cbioportal.aws.mskcc.org'
                        : 'https://chat.cbioportal.org',
                internal: false,
                hide: () =>
                    !this.props.appStore.featureFlagStore.has(
                        FeatureFlagEnum.CHAT
                    ) ||
                    !['public-portal', 'mskcc-portal'].includes(
                        getServerConfig().app_name!
                    ),
            },

            {
                id: 'donate',
                text: (
                    <>
                        <span style={{ color: 'red' }}>
                            <FontAwesome name="heart" />
                        </span>{' '}
                        Donate
                    </>
                ),
                address: 'https://docs.cbioportal.org/donate/',
                internal: false,
                hide: () => !getServerConfig().skin_show_donate_button === true,
            },
        ];
    }

    private getTabs() {
        const shownTabs = this.tabs().filter(t => {
            return !t.hide();
        });

        return shownTabs.map(tab => {
            return (
                <li>
                    {tab.internal ? (
                        <NavLink activeClassName={'selected'} to={tab.address}>
                            {tab.text}
                        </NavLink>
                    ) : (
                        <a target={'_blank'} href={tab.address}>
                            {tab.text}
                        </a>
                    )}
                </li>
            );
        });
    }

    render() {
        return (
            <header>
                <div id="leftHeaderContent">
                    <Link to="/" id="cbioportal-logo">
                        <img
                            src={
                                !!getcBioPortalLogoUrl()
                                    ? getcBioPortalLogoUrl()
                                    : require('../../globalStyles/images/cbioportal_logo.png')
                            }
                            alt="cBioPortal Logo"
                        />
                    </Link>
                    <nav id="main-nav" aria-label="Main navigation">
                        <ul>{this.getTabs()}</ul>
                    </nav>
                </div>
                <div id="rightHeaderContent">
                    <If
                        condition={
                            !getLoadConfig().hide_login &&
                            !getServerConfig().skin_hide_logout_button
                        }
                    >
                        <If condition={this.props.appStore.isLoggedIn}>
                            <Then>
                                <div className="identity">
                                    <Dropdown
                                        id="dat-dropdown"
                                        open={this.datDropdownOpen}
                                        onToggle={
                                            this
                                                .handleDatDropdownToggle
                                        }
                                        {...({
                                            rootCloseEvent:
                                                'mousedown',
                                        } as any)}
                                    >
                                        <Dropdown.Toggle className="btn-sm username">
                                            Logged in as{' '}
                                            {this.props.appStore.userName}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu
                                            style={{
                                                paddingLeft: 10,
                                                overflow: 'auto',
                                                maxHeight: 300,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            <DataAccessTokensDropdown
                                                appStore={this.props.appStore}
                                            />
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            </Then>
                            <Else>
                                <If
                                    condition={
                                        this.props.appStore
                                            .isSocialAuthenticated
                                    }
                                >
                                    <SocialAuthButton
                                        appStore={this.props.appStore}
                                    />
                                </If>
                            </Else>
                        </If>
                    </If>
                    <If condition={!!getInstituteLogoUrl()}>
                        <img
                            id="institute-logo"
                            src={getInstituteLogoUrl()!}
                            alt="Institute Logo"
                        />
                    </If>
                </div>
            </header>
        );
    }
}
