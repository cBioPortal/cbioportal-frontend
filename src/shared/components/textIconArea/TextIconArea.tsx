import * as React from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';
import _ from 'lodash';
import ReactDOM from 'react-dom';
import { observable } from 'mobx';
import autobind from 'autobind-decorator';

export interface ITextIconAreaProps {
    elements: ITextIconAreaItemProps[];
    text: string;
    placeholder?: string;
    classNames?: string[];
    onIconClicked?: (itemValue: string) => void;
    onChangeTextArea?: (textAreaContents: string) => string;
}

export interface ITextIconAreaItemProps {
    label: string;
    value: string;
    classNames?: string[];
}

// This class proves an icon area at the top and a managed textarea at the bottom.
// The contents of the text area are passed to the parent after a set time delay.
// The parent can provide entries back to the component that are displayed as icons in the
// icon area. Icons in the icon area contain a button that when pressed informs the
// parent of the event. The parent can use this for instance for removing this item
// from the icon area.

@observer
class TextIconArea extends React.Component<ITextIconAreaProps, { text: string }> {
    // Shomehow the textare is not able to listen to updates of this field
    // from the parent with MobX. Instead, the parent callback 'onChangeTextArea'
    // returns a string that is used to update the textarea.
    @observable textAreaContent: string = '';
    timeout: NodeJS.Timer | undefined = undefined;
    TIMEOUT_DELAY = 750; // milliseconds

    constructor(props: ITextIconAreaProps) {
        super(props);
        this.textUpdatedByUser = this.textUpdatedByUser.bind(this);
        this.itemRemovedByUser = this.itemRemovedByUser.bind(this);
    }

    private itemRemovedByUser = (event: any) => {
        if (this.props.onIconClicked && event.target) {
            this.props.onIconClicked(event.target.id);
        }
    };

    private textUpdatedByUser = (event: any) => {
        this.textAreaContent = event.currentTarget.value;
        if (this.props.onChangeTextArea) {
            this.startTimedSubmit();
        }
    };

    private startTimedSubmit() {
        this.stopTimedSubmit();

        this.timeout = setTimeout(
            function() {
                this.textAreaContent = this.props.onChangeTextArea(this.textAreaContent);
                this.stopTimedSubmit();
            }.bind(this),
            this.TIMEOUT_DELAY
        );
    }

    private stopTimedSubmit() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    private onAreaClicked = (event: any) => {
        const textArea: any = ReactDOM.findDOMNode(this.refs.textarea);
        textArea.focus();
    };

    render() {
        return (
            <div
                className={classNames('text-icon-area', this.props.classNames)}
                onClick={this.onAreaClicked}
            >
                <div className={classNames('icon-area', this.props.classNames)}>
                    {this.props.elements.map((element: ITextIconAreaItemProps) => {
                        return (
                            <div className={classNames(element.classNames, 'icon')}>
                                {element.label}
                                &nbsp;
                                <div
                                    className={classNames('fa', 'fa-times-circle', 'icon-button')}
                                    onClick={this.itemRemovedByUser}
                                    id={element.value}
                                />
                            </div>
                        );
                    })}
                </div>
                <textarea
                    ref={'textarea'}
                    placeholder={this.props.placeholder}
                    value={this.textAreaContent}
                    onInput={this.textUpdatedByUser}
                    className={classNames('text-area', this.props.classNames)}
                ></textarea>
            </div>
        );
    }
}

export default TextIconArea;
