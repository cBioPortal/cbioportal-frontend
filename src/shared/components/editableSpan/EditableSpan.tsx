import * as React from "react";
import {HTMLProps} from "react";
import {observer} from "mobx-react";
import {computed, observable} from "mobx";

export interface IEditableSpanProps extends HTMLProps<HTMLSpanElement>{
    value:string;
    setValue:(val:string)=>void;
    maxChars?:number;
    numericOnly?:boolean;
}

export default class EditableSpan extends React.Component<IEditableSpanProps, {}> {
    constructor() {
        super();
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onBlur = this.onBlur.bind(this);
    }

    private onKeyPress(evt:React.KeyboardEvent<HTMLSpanElement>) {
        this.props.onKeyPress && this.props.onKeyPress(evt);

        const newKey = evt.key;

        if (newKey === "Enter") {
            evt.preventDefault();
            evt.currentTarget.blur();
            return;
        }

        if (this.props.maxChars && (evt.currentTarget.innerText.length === this.props.maxChars)) {
            evt.preventDefault();
            return;
        }

        if (this.props.numericOnly) {
            const regex = /^\d$/;
            if(!regex.test(newKey)) {
                evt.preventDefault();
            }
        }
    }

    private onBlur(evt:React.FocusEvent<HTMLSpanElement>) {
        this.props.onBlur && this.props.onBlur(evt);

        if (evt.currentTarget.innerText.length > 0) {
            this.props.setValue(evt.currentTarget.innerText);
        }
        evt.currentTarget.innerText = this.props.value;
    }

    render() {
        const {contentEditable, onKeyPress, onBlur,
            value, setValue, maxChars,
            numericOnly, ...spanProps} = this.props;
        return (
            <span
                contentEditable={true}
                onKeyPress={this.onKeyPress}
                onBlur={this.onBlur}
                {...spanProps}
            >
                {this.props.value}
            </span>
        );
    }
}