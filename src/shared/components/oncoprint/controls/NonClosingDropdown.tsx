import * as React from 'react';
import {
    DropdownButtonProps as DropdownButtonPropsStrict,
    DropdownButton as DropdownButtonUntyped,
} from 'react-bootstrap';
// @types/react-bootstrap 0.32 DropdownButtonProps omits `open` / `onToggle`,
// which the v0 runtime actually supports.
type DropdownButtonProps = DropdownButtonPropsStrict & {
    open?: boolean;
    onToggle?: (newOpen: boolean) => void;
    children?: React.ReactNode;
};
const DropdownButton = (DropdownButtonUntyped as unknown) as React.ComponentType<
    DropdownButtonProps
>;
import { observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';

@observer
export default class NonClosingDropdown extends React.Component<
    DropdownButtonProps,
    {}
> {
    private _forceOpen: boolean = false;
    @observable private open: boolean = false;

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @computed private get onToggle() {
        return (newVal: boolean) => {
            if (this._forceOpen) {
                this._forceOpen = false;
            } else {
                this.open = newVal;
            }
            this.props.onToggle && this.props.onToggle(newVal);
        };
    }

    render() {
        const { children, open, onToggle, ...props } = this.props;
        return (
            <DropdownButton
                open={this.open}
                onToggle={this.onToggle}
                {...props}
            >
                {React.Children.toArray(children).map(
                    (x: React.ReactElement<{ onClick?: () => void }>) => {
                        const onClick = x.props.onClick || (() => {});
                        return React.cloneElement(x, {
                            onClick: () => {
                                this._forceOpen = true;
                                onClick();
                            },
                        } as { onClick?: () => void });
                    }
                )}
            </DropdownButton>
        );
    }
}
