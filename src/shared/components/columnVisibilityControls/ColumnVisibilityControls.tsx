import * as React from 'react';
import * as _ from 'lodash';
import {Dropdown, Checkbox} from 'react-bootstrap';

export interface IColumnVisibilityDef {
    id: string;
    name: string;
    visible: boolean;
}

export interface IColumnVisibilityControlsProps {
    className?: string;
    buttonText?: string | JSX.Element;
    columnVisibility?: IColumnVisibilityDef[];
    onColumnToggled?: (columnId: string) => void;
}

/**
 * @author Selcuk Onur Sumer
 * @author Aaron Lisman
 */
export class ColumnVisibilityControls extends React.Component<IColumnVisibilityControlsProps, {}>
{
    public static defaultProps:IColumnVisibilityControlsProps = {
        className: "",
        buttonText: "Columns"
    };

    constructor()
    {
        super();
        this.handleSelect = this.handleSelect.bind(this);
    }

    public render()
    {
        return (
            <Dropdown className={this.props.className} id="dropdown-custom-1">
                <Dropdown.Toggle {...{rootCloseEvent: "click"}} className="btn-sm">
                    {this.props.buttonText}
                </Dropdown.Toggle>
                <Dropdown.Menu {...{bsRole: "menu"}} style={{ paddingLeft:10, overflow:'auto', maxHeight:300, whiteSpace:'nowrap' }}>
                    <ul className="list-unstyled">
                        {
                            this.props.columnVisibility &&
                            _.map(this.props.columnVisibility, (visibility: IColumnVisibilityDef) => {
                                return (
                                    <li key={visibility.id}>
                                        <Checkbox
                                            data-id={visibility.id}
                                            onChange={this.handleSelect as React.FormEventHandler<any>}
                                            checked={visibility.visible}
                                            inline
                                        >
                                                {visibility.name}
                                        </Checkbox>
                                    </li>
                                );
                            })
                        }
                    </ul>
                </Dropdown.Menu>
            </Dropdown>
        );
    }

    private handleSelect(evt: React.FormEvent<HTMLInputElement>)
    {
        const id = evt.currentTarget.getAttribute("data-id");

        if (this.props.onColumnToggled && id) {
            this.props.onColumnToggled(id);
        }
    }
}
