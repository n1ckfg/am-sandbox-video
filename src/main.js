function t(t,n,o,i,a,r,c){try{var e=t[r](c),u=e.value}catch(t){return void o(t)}e.done?n(u):Promise.resolve(u).then(i,a)}(function(){var n,o=(n=function*(){var{sandbox:t}=yield import("sandbox.js"),n="http://localhost:8000",o=window.location;if("/"!==o.pathname){var i=o.pathname.slice(1);n="".concat(n,"/").concat(i)}yield t({root:n,file:"artifact.js"})},function(){var o=this,i=arguments;return new Promise((function(a,r){var c=n.apply(o,i);function e(n){t(c,a,r,e,u,"next",n)}function u(n){t(c,a,r,e,u,"throw",n)}e(void 0)}))});return function(){return o.apply(this,arguments)}})()();
