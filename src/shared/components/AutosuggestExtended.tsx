import * as React from "react";
import Autosuggest from "react-bootstrap-autosuggest";
import {SyntheticEvent} from "react";

type AutosuggestExtendedProps = {
    openOnClick?:boolean|((value:string)=>boolean);
    openOnClickDelayMs?:number;
    datalistOnly?:boolean;
} & {[prop:string]:any}; // Autosuggest props are not exported from the library :(

export default class AutosuggestExtended extends React.Component<AutosuggestExtendedProps, {}> {
    private autosuggest:React.Component<any, any>;
    private openOnClickTimeout:number;

    private shouldOpenOnClick(value:any):boolean {
        return !!(this.props.openOnClick &&
        ((typeof this.props.openOnClick === "boolean") ||
        this.props.openOnClick(value._targetInst._hostNode.value)));
    }

    private refHandler(el: React.Component<any, any>) {
        this.autosuggest = el;
    }

    private clickHandler(value:any) {
        if (this.shouldOpenOnClick(value) && this.autosuggest && !this.autosuggest.state.open) {
            const delay = (typeof this.props.openOnClickDelayMs === "undefined" ? 400 : this.props.openOnClickDelayMs);
            this.openOnClickTimeout = window.setTimeout(()=>{
                this.autosuggest && this.autosuggest.setState({open:true});
            }, delay);
        }
        this.props.onClick && this.props.onClick(value);
    }

    private blurHandler(value:any) {
        window.clearTimeout(this.openOnClickTimeout);
        this.props.onBlur && this.props.onBlur(value);
    }

    constructor() {
        super();
        this.refHandler = this.refHandler.bind(this);
        this.clickHandler = this.clickHandler.bind(this);
        this.blurHandler = this.blurHandler.bind(this);
    }

    render() {
        const {onClick, onBlur, openOnClick, openOnClickDelayMs, ...passAlongProps} = this.props;
        return (
            <Autosuggest
                ref={this.refHandler}
                onClick={this.clickHandler}
                onBlur={this.blurHandler}
                datalistPartial={true /* prevents autocomplete */}
                datalistOnly={typeof this.props.datalistOnly === "undefined" ? true : this.props.datalistOnly /* allows typing to search, makes onChange only fire for valid selection, not intermediate typing*/}
                required={true /* makes onChange not fire for empty input */}
                {...passAlongProps}
            />
        );
    }
}