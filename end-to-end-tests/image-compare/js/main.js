function getURLParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


function getRootUrl(href){
    if (href.includes('circle-artifacts')) {
        return href.substring(0,href.lastIndexOf('/')) + '/';
    } else {
        return './';
    }
}



var rootUrl = getRootUrl(window.location.href);

$(document).ready(function(){


    var $list = $("<ul></ul>").prependTo("body");

    errorImages.forEach((item)=>{
        $(`<li><a data-path='${item}' href="javascript:void">${item}</a></li>`).appendTo($list);
    });

    $list.on('click','a',function(){

        $list.find("a").removeClass('active');

        $(this).addClass('active');
        buildDisplay($(this).attr('data-path'),rootUrl);
    });

    $list.find("a").get(0).click();

});

function buildImagePath(ref, rootUrl){
    return {
        screenImagePath: `${rootUrl}screenshots/` + ref.replace(/^reference\//,'screen/'),
        diffImagePath: `${rootUrl}screenshots/` + ref.replace(/^reference\//,'diff/'),
        refImagePath: `${rootUrl}screenshots/${ref}`,
        imageName: ref.substring(ref.lastIndexOf('/')+1)
    }
}

function buildCurlStatement(data){

    return `curl '${data.screenImagePath}' > 'end-to-end-tests/screenshots/reference/${data.imageName}'; git add 'end-to-end-tests/screenshots/reference/${data.imageName}';`;

}


function buildDisplay(ref, rootUrl){

    var data = buildImagePath(ref,rootUrl);

    var curlStatements = errorImages.map((item)=>{
        var data = buildImagePath(item,rootUrl);
        return buildCurlStatement(data);
    });

    var template = `
     <h3 class="screenshot-name"></h3>
        <div id="juxta" class="juxtapose">
            
        </div>
        
        <h2>Screenshot Diff</h2>
        <h3 class="screenshot-name"></h3>
        <img id="diff" src="${data.diffImagePath}" />
        <h2>Help</h2>
        <p id="help-text">
        When the screenshot test fails, it means that the screenshot taken from
        your instance of the portal differs from the screenshot stored in the
        repo.<br />
        <br />
        1. If the change in the screenshot is <b>undesired</b>, i.e. there is
        regression, you should fix your PR.<br />
        <br />
        2. If the change in the screenshot is <b>desired</b>, add the screenshot
        to the repo, commit it and push it to your PR's branch, that is:
        <br />
        <br />
        <textarea class="curls">${buildCurlStatement(data)}</textarea>
        <br />
        <br />
        Then preferably use git commit --amend and change your commit message
        to explain how the commit changed the screenshot. Subsequently force
        push to your <b>own branch</b>.
        
        <br/>
        <h3>Curls for all failing screenshots</h3>
        <textarea class="curls">${curlStatements.join(' ')}</textarea>
        </p>
    `;

    $("#display").html(template);

    var slider = new juxtapose.JXSlider('#juxta',
        [
            {
                src: data.refImagePath,
                label: 'reference'
            },
            {
                src: data.screenImagePath,
                label: 'screen'
            }
        ],
        {
            animate: true,
            showLabels: true,
            startingPosition: "50%",
            makeResponsive: true
        });

}



function buildPage(){

    var img1 = getURLParameterByName("img1");
    var img2 = getURLParameterByName("img2");
    var label1 = getURLParameterByName("label1");
    var label2 = getURLParameterByName("label2");
    var screenshotName = getURLParameterByName("screenshot_name");
    var diffImage = getURLParameterByName("diff_img");

    if (img1 !== "" && img2 !== "") {
        $("#img1").attr("src", img1);
        $("#img2").attr("src", img2);
        $("#img2-url").html(img2);

        if (screenshotName !== "") {
            $(".screenshot-name").html(screenshotName);
        }
        if (diffImage !== "") {
            $("#diff").attr("src", diffImage);
        }
    } else {
        $("#help-text").text("Set images to compare in URL e.g. ?img1=http://image1.com&img2=http://image2.com&label1=before&label2=after&screenshot_name=test_screenshot");
    }

}