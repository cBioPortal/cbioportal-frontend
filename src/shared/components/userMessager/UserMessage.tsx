import * as React from 'react';
import { observer } from 'mobx-react';
import { remoteData, isWebdriver } from 'cbioportal-frontend-commons';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import _ from 'lodash';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { MobxPromise } from 'mobxpromise';
import { Portal } from 'react-portal';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';

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
        // {
        //     dateEnd: 100000000000000,
        //     content: `<div style="margin:20px;font-size:20px;" class="text-center">
        //         Help us improve cBioPortal. We rely on your feedback to help prioritize features in the next phase of development. Your 5-10 minutes can influence the future direction of cBioPortal.&nbsp;
        //         <br/><br/>
        //         <a target="_blank" class="btn btn-default" data-action="dismiss" href="https://bit.ly/cbioportal-survey-2021">Take Survey</a>
        //         <a class="btn btn-link text-white" data-action="remind">Remind me later</a>
        //         <a class="btn btn-link text-white" data-action="dismiss">No thanks</a>
        //         </div>`,
        //     showCondition: routingStore =>
        //         routingStore.location.pathname.length < 2,
        //     id: '2021_fall_user_survey',
        // },
    ];
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
