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

export abstract class Connector<RootState, StateNode, ActionTypes, Props>
{
	abstract initialState: StateNode;

	/**
	 * Each function here should call this.dispatch() to dispatch an action.
	 */
	abstract actions: {[actionName:string]: (...args:any[])=>void};

	abstract mapStateToProps(state:RootState):Props;

	abstract reducer(state:StateNode, action:ActionTypes):StateNode;

	/**
	 * @deprecated Please use <code>actions</code> instead.
	 */
	mapDispatchToProps?: {[actionName:string]: IActionCreator<ActionTypes>};

	/**
	 * Dispatches an action.
	 * This will be set automatically when a decorated component is created,
	 * or can be set manually for testing.
	 */
	dispatch:IDispatch<ActionTypes>;

	/**
	 * A convenience function with strong typing for updating Redux state.
	 */
	mergeState(oldState:StateNode, newState:StateNode):StateNode
	{
		return SeamlessImmutable.from(oldState).merge(newState) as any as StateNode;
	}

	get decorator()
	{
		let connector = this;
		return <T extends React.ComponentClass<any>>(componentClass:T):T => {
			class ExtendedComponent extends (componentClass as typeof React.Component)<any, any>
			{
				static contextTypes = {store: React.PropTypes.object};

				constructor(props:any, context:{store: {dispatch: IDispatch<ActionTypes>}})
				{
					super(props, context);

					connector.dispatch = context.store.dispatch;
				}
			}
			return connect(this.mapStateToProps, this.mapDispatchToProps)(ExtendedComponent as React.ComponentClass<any>) as T;
		};
	}
}
