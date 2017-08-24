import * as React from 'react';
import {observer} from 'mobx-react';
//import {reaction, computed} from "mobx";
// import {MutationMapperToolPageStore} from "./MutationMapperToolPageStore";

// (window as any).mutationMapperToolPageStore = MutationMapperToolPageStore;

@observer
export default class MutationMapperToolPage extends React.Component<{}, {}> {

    constructor() {
        super();
    }

    public render() {
        return (<div><h1>MutationMapper</h1></div>);
    }
}
