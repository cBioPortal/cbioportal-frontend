import * as React from 'react';
import withContext from 'recompose/withContext';
//import getContext from 'recompose/getContext';

interface ComponentClassWithState<P, S> {
    new (props?: P, context?: any): React.Component<P, S>;
    propTypes?: React.ValidationMap<P>;
    contextTypes?: React.ValidationMap<any>;
    childContextTypes?: React.ValidationMap<any>;
    defaultProps?: P;
    displayName?: string;
}

function createValidator<Store>(storeClass:new(..._:any[])=>Store)
{
	return function validator<T>(object: T, key: keyof T, componentName: string):Error|null {
		if (object[key] instanceof storeClass)
			return null;
		return new Error(`Expecting ${componentName} to receive {store: ${storeClass.name}} from context`);
	};
}

/**
 * This can be used as a decorator to make a component provide a 'store' context property to its children.
 */
export function providesStoreContext<Store>(storeClass:new(..._:any[])=>Store)
{
	return withContext({store: createValidator(storeClass)}, ({store}:{store:Store}) => ({store}));
}

/**
 * Extends React.Component by adding a <code>store</code> getter which reads the <code>store</code> context property.
 * Usage: class MyComponent extends ComponentGetsStoreContext(MyStore)<P, S> { }
 */
export function ComponentGetsStoreContext<Store>(storeClass:new(..._:any[])=>Store)
{
	return class ComponentGetsStoreContext<P, S> extends React.Component<P, S>
	{
		static contextTypes = {
			store: createValidator(storeClass)
		};

		get store():Store
		{
			return this.context.store;
		}
	};
}
