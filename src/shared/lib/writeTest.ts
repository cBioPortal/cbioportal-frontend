import $ from 'jquery';

export function writeTest(fn:Function): void {
    const ret = fn.apply(this,arguments);

    showTest(formatTest(fn.name,Array.slice(arguments),ret));

    return ret;
}

function formatTest(functionName, args, retVal){
    const argString = args.join(', ');
return (
`
define('${functionName}', ()=>{

    it('###should do something###',()=>{
        
        const ret = ${functionName}(${argString});
        
        const expectedResult = ${JSON.stringify(retVal)};
        
        assert.equal(ret, expectedResult);
    
    })

});

`)
}

function showTest(txt: string) {
    $("<textarea/>").css(
        {
            position:'absolute',
            left:200,
            right:200,
            top:100,
            bottom:100,
            zIndex:100
        }
    ).val(txt)
        .appendTo("body")
}

// var old = extendSamplesWithCancerType;
//
// (extendSamplesWithCancerType as any) = function(){
//     var args = Array.from(arguments);
//     var argMap = args.map((a,i)=>`var arg${i}=${JSON.stringify(a)}`);
//     var ret = old.apply(this,arguments);
//     writeTest("me", argMap, JSON.stringify(ret));
//     return ret;
// }
