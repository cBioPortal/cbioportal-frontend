import * as _ from 'lodash';
import * as React from 'react';
import { PropTypes as T} from 'react';
import { Router, RouteConfig } from 'react-router';
import { Provider } from 'react-redux';

type TODO = any;
type RouteConfig = TODO;

declare var __DEBUG__:boolean;

interface IAppProps {
    history: any,
    routes: RouteConfig,
    routerKey: number,
    actions: any,
    store: any,
}

export default class App extends React.Component<IAppProps, void> {
  static contextTypes = {
    router: T.object
  }

  get content() {
    const { history, routes, routerKey, store, actions } = this.props;
    let newProps = {actions, ...this.props};

    const createElement = <T extends React.ComponentClass<any>>(Component:T, props:IAppProps) => {
      return <Component {...newProps} {...props} />
    }

    return (
      <Provider store={store}>
        <Router
          key={routerKey}
          routes={routes}
          createElement={createElement}
          history={history} />
      </Provider>
    )
  }

  get devTools () {
    if (__DEBUG__) {
      if (!(window as any).devToolsExtension) {
        const DevTools = require('../DevTools/DevTools').default;
        return <DevTools />;
      }
    }
  }

  render () {
     return (
       <Provider store={this.props.store}>
         <div style={{ height: '100%' }}>
           {this.content}
           {this.devTools}
         </div>
        </Provider>
     )
   }
}
