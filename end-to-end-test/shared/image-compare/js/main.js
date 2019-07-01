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

var diffSliderMode = true;

function updateComparisonMode() {
    if (!diffSliderMode) {
        $("#juxta").show();
        $("#sidebyside").hide();
    } else {
        $("#sidebyside").show();
        $("#juxta").hide();
    }
}

$(document).on("click", '#toggleDiffModeBtn', ()=>{
    diffSliderMode = !diffSliderMode;
    updateComparisonMode()
});

$(document).ready(function(){

    var selectedSSIndex = 0;

    var $list = $("<ul></ul>").prependTo("body");

    errorImages.forEach((item, index)=>{
        $(`<li><a data-index='${index}' data-path='${item}' href="javascript:void">${item}</a></li>`).appendTo($list);
    });

    $list.on('click','a',function(){

        selectedSSIndex = parseInt($(this).attr('data-index'), 10);
        $list.find("a").removeClass('active');

        $(this).addClass('active');
        buildDisplay($(this).attr('data-path'),rootUrl);
        clearSideBySideInterval();
    });

    $list.find("a").get(0).click();

    function clampSSIndex(i) {
        return Math.max(Math.min(i, errorImages.length-1), 0);
    }

    function selectSS() {
        $(`a[data-index="${selectedSSIndex}"]`).click();
    }

    $("#nextSS").click(()=>{
        selectedSSIndex = clampSSIndex(selectedSSIndex+1);
        selectSS();
    });
    $("#prevSS").click(()=>{
        selectedSSIndex = clampSSIndex(selectedSSIndex-1);
        selectSS();
    });

});


var sideBySideCycleInterval = null;

function buildImagePath(ref, rootUrl){
    return {
        screenImagePath: `${rootUrl}screenshots/` + ref.replace(/^reference\//,'screen/'),
        diffImagePath: `${rootUrl}screenshots/` + ref.replace(/^reference\//,'diff/'),
        refImagePath: `${rootUrl}screenshots/${ref}`,
        imageName: ref.substring(ref.lastIndexOf('/')+1)
    }
}

function buildCurlStatement(data){

    return `curl '${data.screenImagePath}' > 'end-to-end-test/remote/screenshots/reference/${data.imageName}'; git add 'end-to-end-test/remote/screenshots/reference/${data.imageName}';`;

}

function updateSideBySide(opacity) {
    $("#sidebyside div.imgs img.screen")[0].style.opacity = opacity;
}

function clearSideBySideInterval() {
    clearInterval(sideBySideCycleInterval);
    sideBySideCycleInterval = null;
    $("#sidebyside_cycleBtn")[0].style["background-color"] = "#ffffff";
}


function buildDisplay(ref, rootUrl){

    var data = buildImagePath(ref,rootUrl);

    var curlStatements = errorImages.map((item)=>{
        var data = buildImagePath(item,rootUrl);
        return buildCurlStatement(data);
    });

    var template = `
     <h3 class="screenshot-name"></h3>
        <button id="toggleDiffModeBtn" style="font-size:16px">Toggle Comparison Mode</button>
        <br/><br/>
        
        <div id="juxta" class="juxtapose" style="${diffSliderMode ? 'display:none' : 'display:block'}">
            
        </div>
        
       
        
        <div id="sidebyside" style="position:relative">
             <div>
                <div class="slidecontainer">
                  Reference&nbsp;
                  <input type="range" min="0" max="100" value="50" class="slider" id="opacitySlider">
                  &nbsp;Screen
                  &nbsp;&nbsp;&nbsp;<button id="sidebyside_cycleBtn">Cycle</button>
                </div>
             </div>    
        
            <div style="position:relative" class="imgs">
                <img style="border:1px solid; position:absolute;left:0;top:0;" src="${data.refImagePath}"/>
                <img class="screen" style="border:1px solid; position:absolute;left:0;top:0;opacity:0.5;" src="${data.screenImagePath}"/>
                ${""/* the following is done to give this div the correct height, because the sidebyside images cant both be non-absolute positioned */}
                <div style="width:1px; overflow:hidden; display:inline-block; opacity:0">
                    <img src="${data.refImagePath}"/>
                </div>
                <div style="width:1px; overflow:hidden; display:inline-block; opacity:0">
                    <img src="${data.screenImagePath}"/>
                </div>
            </div>
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

    $("#opacitySlider").on("input", (e)=>{
       var opacity = e.target.value/100;
       updateSideBySide(opacity);
    });

    $("#sidebyside_cycleBtn").click(()=>{
        if (sideBySideCycleInterval === null) {
            $("#sidebyside_cycleBtn")[0].style["background-color"] = "#dddddd";
            var ascending = true;
            var hiddenSliderValue = parseInt($("#opacitySlider")[0].value,10); // so as to build in pauses on either end
            sideBySideCycleInterval = setInterval(()=>{
                if (hiddenSliderValue >= 150) {
                    ascending = false;
                } else if (hiddenSliderValue <= -50) {
                    ascending = true;
                }
                hiddenSliderValue += (ascending ? 5 : -5);
                var newSliderValue = hiddenSliderValue;
                if (newSliderValue > 100) { newSliderValue = 100; }
                if (newSliderValue < 0) { newSliderValue = 0; }
                $("#opacitySlider")[0].value = newSliderValue.toString();
                updateSideBySide(newSliderValue/100)
            }, 25);
        } else {
            clearSideBySideInterval();
        }
    });

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
