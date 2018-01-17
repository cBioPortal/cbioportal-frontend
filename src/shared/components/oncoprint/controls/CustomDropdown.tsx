import * as React from "react";
import {Button, Dropdown, ButtonProps} from "react-bootstrap";
import {RootCloseWrapper} from "react-overlays";
import {observer} from "mobx-react";
import {observable} from "mobx";

export interface ICustomDropdownProps extends ButtonProps {
    title: string;
    buttonProps?: ButtonProps;
}

class CustomButton extends React.Component<any,{}> { // cant type this more specifically because of some typing issues w ES6 classes not having component.replaceState
    render() {
        const {bsRole, title, ...props} = this.props;
        return (
            <Button className="btn btn-default" {...props}>
                {title} <span className="caret"/>
            </Button>
        );
    }
}
class CustomMenu extends React.Component<any,{}> {

    render() {
        const { children } = this.props;

        return (
            <div className="dropdown-menu" style={{ padding: '6px' }}>
                {children}
            </div>
        );
    }
}

@observer
export default class CustomDropdown extends React.Component<ButtonProps, {}> {
    @observable private open:boolean = false;

    private toggle:()=>void;
    private hide:()=>void;

    constructor() {
        super();
        this.toggle = ()=>{this.open = !this.open;};
        this.hide = ()=>{this.open = false;};
    }

    render() {
        const {children, id, ...props} = this.props;
        return (
            <RootCloseWrapper onRootClose={this.hide}>
                <Dropdown id={id+""} open={this.open}>
                    <CustomButton bsStyle="default" bsRole="toggle" title="Custom Toggle" onClick={this.toggle} {...props}/>
                    <CustomMenu bsRole="menu">
                        {children}
                    </CustomMenu>
                </Dropdown>
            </RootCloseWrapper>
        );
    }
}

