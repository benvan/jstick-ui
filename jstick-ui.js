var JStickUI = (function(){
    var RADIUS = 25;
    var extend = function(a,b){ for (var i in b) a[i] = b[i]; return a; };
    var shallowClone = function(o){ return extend({}, o); };

    var Ticker = function(tick, time){
        return {
            start: function(){ this.timer = window.setInterval(tick, time); },
            stop: function(){ window.clearInterval(this.timer); },
            tick: tick
        };
    }

    var tpl = '\
        <div class="v-sensitivity-holder"><div class="v-sensitivity-handle"></div></div>\
        <div class="h-sensitivity-holder"><div class="h-sensitivity-handle"></div></div>\
        <div class="ring">\
            <div class="v-handle-holder"><div class="v-handle"></div></div>\
            <div class="h-handle-holder"><div class="h-handle"></div></div>\
            <div class="handle-holder"><div id="handle" class="handle"></div></div>\
        </div>';

    return function(data, opts){
        var defaults = {
            container: document.body,
            sensitivity: {x: 0, y: 0},
            inputs: null,
            mode: 'static', // or continuous
            tickTime: 10 // used only for continuous mode
        };
        var settings = extend(defaults, opts);
        
        var createEntity = function(){
            var container = document.createElement('div');
            container.setAttribute('class', 'jstick-ui-container');
            container.innerHTML = tpl;
            return container;
        };

        var joystickEl = createEntity();
        settings.container.appendChild(joystickEl);

        var handle = joystickEl.getElementsByClassName('handle')[0];
        var vHandle = joystickEl.getElementsByClassName('v-handle')[0];
        var hHandle = joystickEl.getElementsByClassName('h-handle')[0];
        var vHandleHolder = joystickEl.getElementsByClassName('v-handle-holder')[0];
        var hHandleHolder = joystickEl.getElementsByClassName('h-handle-holder')[0];
        
        var snapshot = shallowClone(data);
        var syncData = settings.inputs ? function(){
            settings.inputs.x.value = data.x;
            settings.inputs.y.value = data.y;
        } : function(){} ;

        var ticker = new Ticker( function(){
            var offset = settings.mode == 'continuous' ? data : snapshot;
            data.x = offset.x + jstick.dx(settings.sensitivity.x);
            data.y = offset.y + jstick.dy(settings.sensitivity.y);
            syncData();
        } , settings.tickTime);

        var constrainedStick = function(target, constrainedAxis){
            var jstick = new JStick({
                target: target,
                onactivate: function(){
                    handle.style.transition = vHandleHolder.style.transition = hHandleHolder.style.transition = 0;
                    snapshot = shallowClone(data);
                    ticker.start();
                },
                onrelease: function(){
                    handle.style.transition = vHandleHolder.style.transition = hHandleHolder.style.transition = "0.25s";
                    handle.style.right = 0;
                    handle.style.bottom = 0;
                    vHandleHolder.style.top = 0;
                    hHandleHolder.style.right = 0;
                    ticker.stop();
                },
                ondrag: function(){
                    var x = constrainedAxis == 'y' ? 0 : jstick.dx();
                    var y = constrainedAxis == 'x' ? 0 : jstick.dy();

                    var h = Math.sqrt(y*y+x*x);
                    var d = 0.1*Math.log(h+1);
                    var extent = d*(RADIUS/h);
                    handle.style.right = -x*extent;
                    handle.style.bottom = -y*extent;
                    vHandleHolder.style.top = (y*extent*0.3);
                    hHandleHolder.style.right = -(x*extent*0.3);
                }
            });
            return jstick;
        };

        var vstick = constrainedStick(vHandle, 'y');
        var hstick = constrainedStick(hHandle, 'x');
        var jstick = constrainedStick(handle);

        return {
            enable: function(yesNo){
                vstick.enabled = hstick.enabled = jstick.enabled = yesNo;
            }
        }

    };

})();
        