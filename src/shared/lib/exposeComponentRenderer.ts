import * as React from 'react';
import * as ReactDOM from 'react-dom';

export default function(name: string, Comp: React.ComponentClass<any>, props:any = {}) {

    const win = (window as any);

    if(win) {
        win[name] = (mountNode: HTMLElement): void => {

            let el = React.createElement(
                Comp,
                props
            );

            ReactDOM.render(
                el,
                mountNode
            );
        };
    }

}
