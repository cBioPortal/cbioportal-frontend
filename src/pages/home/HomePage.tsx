import * as React from 'react';

interface IHomePageProps {
}

interface IHomePageState {
}

export default class HomePage extends React.Component<IHomePageProps, IHomePageState> {
    public render() {
        let x = 3;
        x += 4;
        x += 4;
        return <div>Hello TypeScript1</div>;
    }
};
