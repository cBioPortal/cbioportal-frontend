import * as React from 'react';
import { observer } from 'mobx-react';
import { remoteData, isWebdriver } from 'cbioportal-frontend-commons';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import * as _ from 'lodash';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { MobxPromise } from 'mobxpromise';
import { Portal } from 'react-portal';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

export interface IUserMessage {
    dateStart?: number;
    dateEnd: number;
    content: string | JSX.Element;
    id: string;
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
            content: `Please fill out our user survey so we can continue to build a better site for you &nbsp;<a target="_blank" class="btn btn-xs btn-default" href="https://bit.ly/cbioportal-survey-2021">Take Survey</a>`,
            id: '2021_fall_user_survey',
        },
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
            const notYetShown = !localStorage.getItem(
                makeMessageKey(message.id)
            );
            const expired = Date.now() > message.dateEnd;
            return notYetShown && !expired;
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
                    <div className={styles.messager}>
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
