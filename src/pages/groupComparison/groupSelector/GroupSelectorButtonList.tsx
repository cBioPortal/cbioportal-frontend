import * as React from "react";
import {observer} from "mobx-react";
import {SortableContainer} from "react-sortable-hoc";

export interface IGroupSelectorButtonListProps {
    buttons:any[];
}

@observer
class GroupSelectorButtonList extends React.Component<IGroupSelectorButtonListProps, {}> {
    render() {
        return (
            <div>
                {this.props.buttons}
            </div>
        );
    }
}

export default SortableContainer(GroupSelectorButtonList);