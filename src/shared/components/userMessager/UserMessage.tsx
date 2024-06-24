import * as React from 'react';
import { observer } from 'mobx-react';
import { remoteData, isWebdriver } from 'cbioportal-frontend-commons';
import { action, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import _ from 'lodash';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { Portal } from 'react-portal';
import { getBrowserWindow, MobxPromise } from 'cbioportal-frontend-commons';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import { getServerConfig } from 'config/config';

export interface IUserMessage {
    dateStart?: number;
    dateEnd: number;
    content: string | JSX.Element;
    id: string;
    showCondition?: (routingStore: ExtendedRouterStore) => void;
}

function makeMessageKey(id: string) {
    return `portalMessageKey-${id}`;
}

let MESSAGE_DATA: IUserMessage[];

if (
    [
        'www.cbioportal.org',
        'cbioportal.mskcc.org',
        'genie.cbioportal.org',
    ].includes(getBrowserWindow().location.hostname)
) {
    MESSAGE_DATA = [
        // ADD MESSAGE IN FOLLOWING FORMAT
        // UNIQUE ID IS IMPORTANT B/C WE REMEMBER A MESSAGE HAS BEEN SHOWN
        // BASED ON USERS LOCALSTORAGE

        {
            dateEnd: 100000000000000,
            content: `Re-introducing the cBioPortal Newsletter! Subscribe via <a href="https://www.linkedin.com/newsletters/cbioportal-newsletter-7178731490539634689/" target="_blank">LinkedIn</a> or <a href="https://groups.google.com/g/cbioportal-news" target="_blank">Google Groups</a>`,
            showCondition: routingStore => {
                return getServerConfig().app_name === 'public-portal';
            },
            id: '2024_newsletter_intro',
        },
    ];

    // MSK specific messaging
    if (
        ['cbioportal.mskcc.org'].includes(getBrowserWindow().location.hostname)
    ) {
        MESSAGE_DATA.push({
            dateEnd: 100000000000000,
            content: `The <a href="https://cbioportal.mskcc.org/study/summary?id=mskimpact" _target="_blank">MSK-IMPACT cohort</a> now includes additional NLP-derived data elements from the Cancer Data Science Initiative (<a href="https://mskcc.sharepoint.com/sites/pub-CDSI" target="_blank">Read more</a>)`,
            id: '2023_msk_chord_release',
        });
    }
}

interface IUserMessagerProps {
    dataUrl?: string;
    messages?: IUserMessage[];
}

@observer
export default class UserMessager extends React.Component<
    IUserMessagerProps,
    {}
> {
    constructor(props: IUserMessagerProps) {
        super(props);
        makeObservable(this);
        this.messageData = remoteData<IUserMessage[]>(async () => {
            return Promise.resolve(props.messages || MESSAGE_DATA);
        });
    }
    private messageData: MobxPromise<IUserMessage[]>;

    @observable dismissed = false;

    get shownMessage() {
        const messageToShow = _.find(this.messageData.result, message => {
            // not shown in either session or local storage
            // (session is used for remind
            const notYetShown =
                !localStorage.getItem(makeMessageKey(message.id)) &&
                !sessionStorage.getItem(makeMessageKey(message.id));
            const expired = Date.now() > message.dateEnd;

            const showCondition = message.showCondition
                ? message.showCondition(getBrowserWindow().routingStore)
                : true;

            return notYetShown && !expired && showCondition;
        });

        return messageToShow;
    }

    @autobind
    close() {
        this.markMessageDismissed(this.shownMessage!);
    }

    @action
    markMessageDismissed(message: IUserMessage) {
        localStorage.setItem(makeMessageKey(message.id), 'shown');
        this.dismissed = true;
    }

    @action
    markMessageRemind(message: IUserMessage) {
        sessionStorage.setItem(makeMessageKey(message.id), 'shown');
        this.dismissed = true;
    }

    @autobind
    handleClick(e: any) {
        console.log(e.target.getAttribute('data-action'));
        switch (e.target.getAttribute('data-action')) {
            case 'remind':
                this.shownMessage && this.markMessageRemind(this.shownMessage);
                break;
            case 'dismiss':
                this.shownMessage &&
                    this.markMessageDismissed(this.shownMessage);
                break;
        }
        //;
    }

    render() {
        if (
            !isWebdriver() &&
            !this.dismissed &&
            this.messageData.isComplete &&
            this.shownMessage
        ) {
            return (
                <Portal
                    isOpened={true}
                    node={document.getElementById('pageTopContainer')}
                >
                    <div className={styles.messager} onClick={this.handleClick}>
                        <i
                            className={classNames(
                                styles.close,
                                'fa',
                                'fa-close'
                            )}
                            onClick={this.close}
                        />
                        {typeof this.shownMessage.content === 'string' ? (
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: this.shownMessage.content,
                                }}
                            />
                        ) : (
                            <div>{this.shownMessage.content}</div>
                        )}
                    </div>
                </Portal>
            );
        } else {
            return null;
        }
    }
}
