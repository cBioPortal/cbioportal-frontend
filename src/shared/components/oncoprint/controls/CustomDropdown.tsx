import * as React from 'react';
import { Button, Dropdown, ButtonProps } from 'react-bootstrap';
import { RootCloseWrapper } from 'react-overlays';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

export interface ICustomDropdownProps extends ButtonProps {
    title: string;
    className?: string;
}

class CustomButton extends React.Component<any, {}> {
    // cant type this more specifically because of some typing issues w ES6 classes not having component.replaceState
    render() {
        const { bsRole, title, ...props } = this.props;
        return (
            <Button className="btn btn-default" {...props}>
                {title} {this.props.titleElement} <span className="caret" />
            </Button>
        );
    }
}
class CustomMenu extends React.Component<any, {}> {
    render() {
        const { className, children } = this.props;

        return (
            <div className={classNames('dropdown-menu', className)} style={{ padding: '6px' }}>
                {children}
            </div>
        );
    }
}

@observer
export default class CustomDropdown extends React.Component<
    ButtonProps & { titleElement?: JSX.Element },
    {}
> {
    @observable private open: boolean = false;

    private toggle: () => void;
    private hide: () => void;

    constructor(props: ButtonProps) {
        super(props);
        this.toggle = () => {
            this.open = !this.open;
        };
        this.hide = () => {
            this.open = false;
        };
    }

    render() {
        const { children, id, className, ref, ...props } = this.props;
        return (
            <RootCloseWrapper onRootClose={this.hide}>
                <Dropdown id={id + ''} open={this.open}>
                    <CustomButton
                        bsStyle="default"
                        bsRole="toggle"
                        title="Custom Toggle"
                        onClick={this.toggle}
                        {...props}
                    />
                    <CustomMenu bsRole="menu" className={classNames(className)}>
                        {children}
                    </CustomMenu>
                </Dropdown>
            </RootCloseWrapper>
        );
    }
}
