import { c as createGenerator, W as WebXRSupports, s as fetchData, $ as $, _ as assign, w as wait, T as Three } from "./vendor.js";
import { Preload } from "./Preload.js";

let sandbox = function() {
    let run = createGenerator(function*(options) {
        let { artifact: artifact, file: file, root: root } = options;

        WebXRSupports.SUPPORTS = yield fetchData();
        let { XR: XR } = WebXRSupports.SUPPORTS;
        let showArtifactButton = $("#show-artifact");
    
        if (!artifact) {
            WebXRSupports.SUPPORTS.WEBP = false;
            WebXRSupports.SUPPORTS.WEBM = false;
            let { default: defaultData } = yield import(`${root}/${file}`);
            artifact = assign(assign({}, defaultData), {}, { city: "" });
        }
    
        $.on(showArtifactButton, "click", function(options) {
            let { artifact: artifact, map: map, root: root, XR: XR = false } = options;
            
            return createGenerator(function*() {
                let preload = new Preload({ artifact: artifact, root: root, THREE: Three });
                let showArtifactButton = $("#show-artifact");
                showArtifactButton.disabled = true;
                try {
                    if (!preload._isWorking) {
                        yield preload.init({ artifact: artifact, map: map, THREE: Three, XR: XR });
                        yield preload.startEngine({ artifact: artifact, map: map, THREE: Three, XR: XR });
                        showArtifactButton.disabled = false;
                    }
                } catch (error) {
                    if (error.toString().toLowerCase().includes("error creating webgl context")) {
                        preload.showWebglDisabledNotification();
                    } else {
                        console.error("onButtonClick: preload.init failed", error);
                    }
                }
            });
        }({ artifact: artifact, root: root, XR: XR }));
    
        /*
        if (e) {
            $("a").forEach(function(element) {
                element.removeAttribute("target");
            });
        }*/
    });
    
    return function(options) {
        return run.apply(this, arguments);
    };
}();

export { sandbox };