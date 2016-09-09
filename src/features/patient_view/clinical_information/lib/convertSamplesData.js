export default function(data) {

    const output = { columns:[],  items:{} };

    data.forEach((sample)=>{

        let sampleId = sample.id;

        output.columns.push({ id: sampleId });

        sample.clinicalData.forEach((dataItem)=>{

            output.items[dataItem.id] = output.items[dataItem.id] || {};
            output.items[dataItem.id][sampleId] = dataItem.value.toString();
            output.items[dataItem.id].name = dataItem.name;
            output.items[dataItem.id].id = dataItem.id;

        });


    });

    return output;


};
