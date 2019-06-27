import {Modal} from "react-bootstrap";
import * as React from "react";
import {observer} from "mobx-react";
import request from 'superagent';
import {remoteData} from "public-lib/api/remoteData";
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";
import * as _ from 'lodash';
import styles from './styles.module.scss';
import classNames from 'classnames';
import {isWebdriver} from "shared/lib/tracking";

export interface IUserMessage {
    dateStart?:number;
    title:string;
    dateEnd:number;
    content:string;
    id:string;
};

function makeMessageKey(id:string){
    return `portalMessageKey-${id}`;
}

const MESSAGE_DATA_TEST: IUserMessage[] = [
    {
        dateEnd:100000000000000,
        content: `<strong>Announcing the new Group Comparison feature</strong>: Compare clinical and genomic features of user-defined groups of samples/patients.  <a class='btn btn-primary' href="/tutorials#group-comparison" target="_blank">View Tutorial</a>`,
        id:'3.0-intro',
        title:'Announcing the Group Comparison feature of cBioPortal 3.0!'
    }
];


@observer
export default class UserMessager extends React.Component<{ dataUrl?:string }, {}> {

    messageData = remoteData<IUserMessage[]>(async ()=>{
        //const data = await request(this.props.dataUrl);
        return Promise.resolve(MESSAGE_DATA_TEST);

    });

    @observable dismissed = false;

    get shownMessage(){
        const messageToShow =  _.find(this.messageData.result,(message)=>{
            const notYetShown = !localStorage.getItem(makeMessageKey(message.id));
            const expired = Date.now() > message.dateEnd;
            return notYetShown && !expired;
        });

        return messageToShow;
    }

    @autobind
    close(){
        this.markMessageDismissed(this.shownMessage!);
    }

    @action
    markMessageDismissed(message:IUserMessage){
        localStorage.setItem(makeMessageKey(message.id),"shown");
        this.dismissed = true;
    }


    render(){

        if (!isWebdriver() && !this.dismissed && (this.messageData.isComplete && this.shownMessage)) {
            return (<div className={styles.messager}>
                        <i className={classNames(styles.close,'fa', 'fa-close')} onClick={this.close} />
                        <div dangerouslySetInnerHTML={{__html:this.shownMessage!.content}}></div>
                     </div>);
        } else {
            return null;
        }



    }
}
