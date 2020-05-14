import * as React from 'react';
import { observer } from 'mobx-react';
import { remoteData, isWebdriver } from 'cbioportal-frontend-commons';
import { action, computed, observable } from 'mobx';
import autobind from 'autobind-decorator';
import * as _ from 'lodash';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

export interface IUserMessage {
    dateStart?: number;
    dateEnd: number;
    content: string;
    id: string;
}

function makeMessageKey(id: string) {
    return `portalMessageKey-${id}`;
}

// ADD MESSAGE IN FOLLOWING FORMAT
// UNIQUE ID IS IMPORTANT B/C WE REMEMBER A MESSAGE HAS BEEN SHOWN
// BASED ON USERS LOCALSTORAGE
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
            content: `Join our new webinar series to learn how to use cBioPortal effectively. Fourth webinar <strong>Thursday May 21st 11am-12pm EDT</strong>. <a class="btn btn-primary btn-xs" target="_blank" href="https://dfci.zoom.us/webinar/register/7315875611981/WN_An_3l0XYQHCoinWvclUrlw">Click for More Info!</a> or <a class="btn btn-primary btn-xs" href="/tutorials#webinars">View Recorded Webinars</a>`,
            id: '2020_spring_webinar',
        },
    ];
}

@observer
export default class UserMessager extends React.Component<
    { dataUrl?: string },
    {}
> {
    messageData = remoteData<IUserMessage[]>(async () => {
        return Promise.resolve(MESSAGE_DATA);
    });

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
            (this.messageData.isComplete && this.shownMessage)
        ) {
            return (
                <div className={styles.messager}>
                    <i
                        className={classNames(styles.close, 'fa', 'fa-close')}
                        onClick={this.close}
                    />
                    <div
                        dangerouslySetInnerHTML={{
                            __html: this.shownMessage!.content,
                        }}
                    ></div>
                </div>
            );
        } else {
            return null;
        }
    }
}
