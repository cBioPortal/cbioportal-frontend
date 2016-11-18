import * as SeamlessImmutable from 'seamless-immutable';
import { connect } from 'react-redux';
import * as React from 'react';
import MapDispatchToPropsObject = ReactRedux.MapDispatchToPropsObject;
import ActionCreator = ReactRedux.ActionCreator;
import Action = Redux.Action;

export type IDispatch<A> = (action:A)=>void;
export type IActionCreator<A> = ActionCreator<A | ((dispatch:IDispatch<A>) => void)>;
export type IReducer<StateNode, A extends Action> = (state:StateNode, action:A)=>StateNode;
export type IComponentDecorator = <T extends React.ComponentClass<any>>(t:T)=>T;

export abstract class Connector<RootState, StateNode, ActionTypes, Props> {
    abstract initialState: StateNode;
    abstract mapDispatchToProps: {[actionName:string]: IActionCreator<ActionTypes>};
    abstract mapStateToProps(state:RootState):Props;
    abstract reducer(state:StateNode, action:ActionTypes):StateNode;

    mergeState(oldState:StateNode, newState:StateNode):StateNode
    {
        return SeamlessImmutable.from(oldState).merge(newState) as any as StateNode;
    }

    get decorator() {
        return connect(this.mapStateToProps, this.mapDispatchToProps) as IComponentDecorator;
    }
}
