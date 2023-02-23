function runGenerator(gen, resolve, reject, next, thrower, key, arg) {
    let result, value;
    try {
        result = gen[key](arg);
        value = result.value;
    } catch (error) {
        return void reject(error);
    }

    if (result.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(next, thrower);
    }
}

(function() {
    let generator = function*() {
        let { sandbox: runGenerator } = yield import("./sandbox.js");

        let location = window.location;
        
	    //let url = location.href;
        let url = location.hostname;
        if (url === "localhost") {
            url = "http://" + url + ":" + location.port;
        } else {
            url = "https://" + url;
        }

        if (location.pathname !== "/") {
            let path = location.pathname.slice(1);
            url = `${url}/${path}`;
        }

        yield runGenerator({ root: url, file: "artifact.js" });
    };

    return function() {
        return new Promise((resolve, reject) => {
            let generatorInstance = generator.apply(this, arguments);
            function next(value) {
                runGenerator(generatorInstance, resolve, reject, next, thrower, "next", value);
            }

            function thrower(error) {
                runGenerator(generatorInstance, resolve, reject, next, thrower, "throw", error);
            }

            next(void 0);
        });
    };
})()();