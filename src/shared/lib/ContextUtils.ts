import * as React from 'react';
import withContext from 'recompose/withContext';

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
		return new Error(`Expecting ${componentName} to receive {${JSON.stringify(key)}: ${storeClass.name}} from context`);
	};
}

/**
 * This can be used as a decorator to make a component provide a <code>store</code> context property to its children.
 * Usage:
 *   <code>
 *   @providesStoreContext(MyStore)
 *   export class MyClass extends React.Component&lt;P, S&gt; { }
 *   </code>
 */
export function providesStoreContext<Store>(storeClass:new(..._:any[])=>Store)
{
	return withContext({store: createValidator(storeClass)}, ({store}:{store:Store}) => ({store}));
}

/**
 * Extends React.Component by adding a <code>store</code> getter which reads the <code>store</code> context property.
 * Usage: <code>class MyComponent extends ComponentGetsStoreContext(MyStore)<P, S> { }</code>
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
