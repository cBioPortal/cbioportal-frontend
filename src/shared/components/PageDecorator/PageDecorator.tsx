import * as React from 'react';

export default function(component: typeof React.Component): any {
    return class extends component<any, any> {
        render() {
            if ((window as any).devContext) {
                return super.render();
            } else {
                return <span style={{ display: 'none' }} />;
            }
        }
    };
}
