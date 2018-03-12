import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import $ from 'jquery';
import {observer} from "mobx-react";
import {remoteData} from "../../shared/api/remoteData";
import {action, computed, observable, reaction} from "mobx";


function getMutatedGenes(query:string){
    console.log("fetching genes");
    return new Promise((resolve,reject)=>{
        setTimeout(function(){
            resolve(_.filter(["aaron","nora","natasha", "john"],(name:string)=>name.includes(query)))
        },1000);
    });

}


class StudyViewPageStore {

    constructor(){

    }

    @observable filterTerm = "";

    readonly mutatedGenes = remoteData({

        await:()=>[
            this.prelimData
        ],

        invoke:()=>{

            return getMutatedGenes(this.filterTerm);

        }

    });

    readonly prelimData = remoteData({

        invoke:()=>{

            return getMutatedGenes(this.prelimParam);

        }

    });


    readonly mutatedGenes = remoteData({

        await:()=>[

        ],

        invoke:()=>{

            return getMutatedGenes(this.filterTerm);

        }

    });

}


// making this an observer (mobx-react) causes this component to re-render any time
// there is a change to any observable value which is referenced in its render method. 
// Even if this value is referenced deep within some helper method
@observer
export default class StudyViewPage extends React.Component<{}, {}> {

    store:StudyViewPageStore;
    queryInput:HTMLInputElement;

    constructor(){
        super();

        this.store = new StudyViewPageStore();

        const reaction1 = reaction(
            () => this.store.filterTerm,
            term => console.log("reaction 1:", term)
        );

    }

    @observable tooltipState = true;

    @action handleQueryChange(){

        this.store.filterTerm=this.queryInput.value;

    }

    render(){
        return (

            <div>
                <input type="text"
                       value={this.store.filterTerm}
                       ref={(el:HTMLInputElement)=>this.queryInput = el}
                       onInput={ (el:HTMLInputElement)=>this.handleQueryChange() }
                />
                <div>

                    {

                        (this.store.mutatedGenes.isPending) && (
                            <div>Loading the mutated genes</div>
                        )

                    }

                </div>
            </div>
        )

    }
}
