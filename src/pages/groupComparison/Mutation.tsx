import * as React from 'react';
import 'react-rangeslider/lib/index.css';
import { observer } from 'mobx-react';
import _ from 'lodash';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import { observable, action, makeObservable } from 'mobx';

export interface IMutationProps {
    store: ComparisonStore;
}

@observer
export default class Mutation extends React.Component<IMutationProps, {}> {
    constructor(props: IMutationProps) {
        super(props);
        makeObservable(this);
    }
}
