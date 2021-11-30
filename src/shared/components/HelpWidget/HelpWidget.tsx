import * as React from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { Modal } from 'react-bootstrap';

interface IHelpWidgetProps {
    path: string;
}

function parseConfiguration(markdown: string) {
    const items = markdown.trim().split(/URLMATCH:/);
    console.log(items);

    const parsed = items.reduce((ret: any[], s) => {
        if (s.length) {
            ret.push({
                regexp: s.match(/[^\n]*/)![0],
                markdown: s.substr(s.indexOf('\n')),
            });
        }
        return ret;
    }, []);

    return parsed;
}

export const HelpWidget: React.FunctionComponent<IHelpWidgetProps> = function({
    path,
}: IHelpWidgetProps) {
    const confs = parseConfiguration(markdown);

    const conf = confs.find(c => {
        return new RegExp(c.regexp).test(path);
    });

    if (!conf) return <></>;

    const md = conf.markdown.trim();

    const [modalOpenState, setModalOpenState] = useState(false);

    let el: JSX.Element;

    if (/\n/.test(md)) {
        el = <a onClick={() => setModalOpenState(true)}>Oncoprint Help</a>;
    } else {
        el = (
            <>
                <ReactMarkdown linkTarget={'_blank'}>{md}</ReactMarkdown>{' '}
                <i className={'fa fa-video-camera'} />
            </>
        );
    }

    return (
        <div className={styles['widget-wrapper']}>
            {el}
            <Modal
                show={modalOpenState}
                onHide={() => setModalOpenState(false)}
            >
                <Modal.Header closeButton={true}>cBioPortal Help</Modal.Header>
                <Modal.Body>
                    <ReactMarkdown>{md}</ReactMarkdown>
                </Modal.Body>
            </Modal>
        </div>
    );
};

const markdown = `

URLMATCH:results/mutations
[How-to: filtering clinical data](https://www.youtube.com/watch?v=q9No2073c5o) 

URLMATCH:study/.*
[How-to: expression-based comparisons](https://www.youtube.com/watch?v=HTiKUXk0j0s)
`;
