import * as $ from 'jquery';

export default function getClinicalInformationData(){

    return $.ajax({ type:"GET", url:"/" });

}

