import React from 'react';

class TreeView extends React.Component {

    render() {

        return <div>I am a tree view</div>;

    }

};


class ResultSet extends React.Component {

    render() {

        return <div>I am a result set</div>;

    }

};



// Think of this as the layout for the homepage.
export default () => (
    <div>
        <TreeView />
        <ResultSet />
    </div>
);


