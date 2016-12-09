import * as React from 'react';

//// QuerySession.ts
interface IExampleDataModel {
    id:number;
    type:string;
}


interface IExampleDataResponse {

    fetchStatus:'fetching'|'complete';
    data?: Array<IExampleDataModel>;

}

declare type MyHandler = (myArgument: IExampleDataResponse) => void;

const QuerySession = {

    fetchAndObserveExampleData(mutationIds:Array<number>, callback:MyHandler){

        // check to see if data is already available for these ids
        // IF YES: return data and observe future changes
        // IF NO: fetch data and observe future changes
        // respond now and on future changes by invoking the callback
        callback({ fetchStatus:'fetching' });

        // for example, when network request finishes we would fire something like this
        setTimeout(()=>callback({ fetchStatus:'complete', data:[{ id:0, type:'whatever' },{ id:1, type:'whatever' }] }), 5000);

    }

};

interface IExampleComponentState {
    exampleData:IExampleDataResponse; // i want this to be IExampleDataModel but I want to also track it's status here.
}


//// ExampleComponent.tsx
export default class ExampleComponent extends React.Component<{}, IExampleComponentState> {

    componentWillMount(){

        //NOTE: this cannot be used in constructor because setState is called syncronously here
        //and you cannot call setState in constructor
        // PROBLEM: how do we unsubscribe
        QuerySession.fetchAndObserveExampleData([0,1], (dataObject)=>{
            this.setState({ exampleData: dataObject });
        });

    }

    public render(){

        return (<div>{ this.state.exampleData.fetchStatus }</div>);

    }



}

