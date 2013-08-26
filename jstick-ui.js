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
    };

    var tpl = '\
        <div class="v-sensitivity-holder"><div class="sensitivity-handle"></div></div>\
        <div class="h-sensitivity-holder"><div class="sensitivity-handle"></div></div>\
        <div class="ring">\
            <div class="v-handle-holder"><div class="v-handle"></div></div>\
            <div class="h-handle-holder"><div class="h-handle"></div></div>\
            <div class="handle-holder"><div id="handle" class="handle"></div></div>\
        </div>';

    return function(opts){
        var defaults = {
            container: document.body,
            sensitivity: {
                x: { min: 0, max: 10, val: 0 },
                y: { min: 0, max: 10, val: 0 }
            },
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

        var getChild = function(className){ return joystickEl.getElementsByClassName(className)[0]; };

        var handle = getChild('handle');
        var vHandle = getChild('v-handle');
        var hHandle = getChild('h-handle');
        var vHandleHolder = getChild('v-handle-holder');
        var hHandleHolder = getChild('h-handle-holder');
        var vsHandle = getChild('v-sensitivity-holder').children[0];
        var hsHandle = getChild('h-sensitivity-holder').children[0];
        
        var snapshot = settings.getData();
        var syncData = settings.inputs ? function(){
            var data = settings.getData();
            settings.inputs.x.value = data.x;
            settings.inputs.y.value = data.y;
        } : function(){} ;

        var enableTextSelection = function(enabled){
            var cls = document.body.getAttribute('class');
            if (!enabled){
                document.body.setAttribute('class', 'jstick-ui-suppress-selection ' + cls)
            }else{
                document.body.setAttribute('class', cls.replace('jstick-ui-suppress-selection ', ''))
            }
        };
        
        var constrainedStick = function(target, constrainedAxis){
            var ticker = new Ticker( function(){
                var data = settings.getData();
                var offset = settings.mode == 'continuous' ? data : snapshot;
                var x = (constrainedAxis != 'y') ? offset.x + stick.dx(data.xSensitivity) : data.x;
                var y = (constrainedAxis != 'x') ? offset.y + stick.dy(data.ySensitivity) : data.y;
                settings.setData(extend(data,{
                    x:x,
                    y:y
                }));
                syncData();
            } , settings.tickTime);
            var stick = new JStick({
                target: target,
                onactivate: function(){
                    handle.style.transition = vHandleHolder.style.transition = hHandleHolder.style.transition = 0;
                    snapshot = settings.getData();
                    enableTextSelection(false);
                    ticker.start();
                },
                onrelease: function(){
                    handle.style.transition = vHandleHolder.style.transition = hHandleHolder.style.transition = "0.25s";
                    handle.style.right = 0;
                    handle.style.bottom = 0;
                    vHandleHolder.style.top = 0;
                    hHandleHolder.style.right = 0;
                    enableTextSelection(true);
                    ticker.stop();
                },
                ondrag: function(){
                    var x = constrainedAxis == 'y' ? 0 : this.dx();
                    var y = constrainedAxis == 'x' ? 0 : this.dy();
                    
                    var h = Math.sqrt(y*y+x*x);
                    var d = 0.1*Math.log(h+1);
                    var extent = d*(RADIUS/h);
                    handle.style.right = -x*extent + "px";
                    handle.style.bottom = y*extent + "px";
                    vHandleHolder.style.top = -(y*extent*0.3) + "px";
                    hHandleHolder.style.right = -(x*extent*0.3) + "px";
                }
            });
        };

        var vStick = constrainedStick(vHandle, 'y');
        var hStick = constrainedStick(hHandle, 'x');
        var jStick = constrainedStick(handle);

        var sensitivityStick = function(target, axis){
            var holder = target.parentElement;
            var size = Math.max(holder.offsetWidth, holder.offsetHeight);
            var snapshot = settings.getData()[axis+'Sensitivity'];
            var syncHandle = function(val, range){
                var v = range.min + (val / (range.max - range.min));
                var pixelV = size * v;
                target.style[axis == 'x' ? 'left' : 'bottom'] = pixelV + "px";
                target.setAttribute('data-sensitivity', val.toFixed(2));
            };
            syncHandle(snapshot, settings.sensitivity[axis]);
            return {
                sync: function(){
                    syncHandle(settings.getData()[axis+'Sensitivity'], settings.sensitivity[axis]);
                    syncData()
                },
                stick: new JStick({
                    target: target,
                    onactivate: function(){ snapshot = settings.getData()[axis+'Sensitivity']; },
                    ondrag: function(){
                        var range = settings.sensitivity[axis];
                        var pixelOffset = this['d'+axis]();
                        var sensitivityOffset = (pixelOffset / size)*(range.max - range.min);
                        var value = Math.max(range.min, Math.min(range.max, snapshot + sensitivityOffset));
                        var data = settings.getData();
                        data[axis+'Sensitivity'] = value;
                        settings.setData(data);
                        syncHandle(value, range);
                    }
                })
            };
        };

        var hsStick = sensitivityStick(hsHandle, 'x');
        var vsStick = sensitivityStick(vsHandle, 'y');
    
        return {
            sync: function(){
                hsStick.sync();
                vsStick.sync();
            },
            enable: function(yesNo){
                vStick.enabled = vStick.enabled = jStick.enabled = yesNo;
            }
        }

    };

})();
        