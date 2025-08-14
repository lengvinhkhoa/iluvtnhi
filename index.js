window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime;
            if (lastTime === undefined) {
                lastTime = 0;
            }
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));

var loaded = false;

var sparkles = [];
var sparkleContainer = document.getElementById('sparkles');

// Optimize sparkle creation for mobile
function createSparkle() {
    // Reduce sparkle frequency on mobile for better performance
    if (window.isDevice && Math.random() > 0.7) return;
    
    var sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = Math.random() * window.innerWidth + 'px';
    sparkle.style.top = Math.random() * window.innerHeight + 'px';
    sparkle.style.animationDelay = Math.random() * 2 + 's';
    sparkleContainer.appendChild(sparkle);
    
    setTimeout(() => {
        if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
        }
    }, 2000);
}

// Adjust sparkle interval based on device
var sparkleInterval = window.isDevice ? 500 : 300;
setInterval(createSparkle, sparkleInterval);

var init = function () {
    if (loaded) return;
    loaded = true;
    
    var mobile = window.isDevice;
    var koef = mobile ? 0.5 : 1;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = koef * innerWidth;
    var height = canvas.height = koef * innerHeight;
    var rand = Math.random;
    
    // Optimize colors for mobile
    var colors = [
        "hsla(0, 100.00%, 80.00%, 0.80)",    
        "hsla(331, 100.00%, 90.00%, 0.80)",
    ];
    
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, 0, width, height);

    var heartPosition = function (rad) {
        return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
    };
    
    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    // Optimized resize handler for mobile
    var resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            width = canvas.width = koef * innerWidth;
            height = canvas.height = koef * innerHeight;
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            ctx.fillRect(0, 0, width, height);
        }, 100); // Debounce resize events
    });

    // Optimize particle count for mobile
    var traceCount = mobile ? 20 : 60;
    var pointsOrigin = [];
    var i;
    var dr = mobile ? 0.3 : 0.05; // Increase step size for mobile
    
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 250, 15, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 200, 12, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 100, 6, 0, 0));
    
    var heartPointsCount = pointsOrigin.length;

    var targetPoints = [];
    var pulse = function (kx, ky) {
        for (i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [];
            targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2;
            targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
        }
    };

    // Optimize particle count for mobile
    var particleCount = mobile ? Math.floor(heartPointsCount * 0.6) : heartPointsCount;
    var e = [];
    for (i = 0; i < particleCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        var colorIndex = Math.floor(rand() * colors.length);
        e[i] = {
            vx: 0,
            vy: 0,
            R: 2,
            speed: rand() + 3,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.3 * rand() + 0.6,
            f: colors[colorIndex],
            trace: [],
            size: rand() * 2 + 1
        };
        for (var k = 0; k < traceCount; k++) e[i].trace[k] = { x: x, y: y };
    }

    // Optimize animation config for mobile
    var config = {
        traceK: mobile ? 0.4 : 0.3, // Faster trace decay on mobile
        timeDelta: mobile ? 0.012 : 0.008 // Slower animation on mobile for better performance
    };

    var time = 0;
    var lastFrameTime = 0;
    var targetFPS = mobile ? 30 : 60; // Lower FPS on mobile
    var frameInterval = 1000 / targetFPS;
    
    var loop = function (currentTime) {
        // Frame rate limiting for mobile
        if (mobile && currentTime - lastFrameTime < frameInterval) {
            window.requestAnimationFrame(loop, canvas);
            return;
        }
        lastFrameTime = currentTime;
        
        var n = -Math.cos(time);
        pulse((1 + n) * .5, (1 + n) * .5);
        time += ((Math.sin(time)) < 0 ? 6 : (n > 0.8) ? .15 : 0.8) * config.timeDelta;
        
        ctx.fillStyle = "rgba(0,0,0,.08)";
        ctx.fillRect(0, 0, width, height);
        
        for (i = e.length; i--;) {
            var u = e[i];
            var q = targetPoints[u.q];
            var dx = u.trace[0].x - q[0];
            var dy = u.trace[0].y - q[1];
            var length = Math.sqrt(dx * dx + dy * dy);
            
            if (8 > length) {
                if (0.92 < rand()) {
                    u.q = ~~(rand() * heartPointsCount);
                } else {
                    if (0.98 < rand()) {
                        u.D *= -1;
                    }
                    u.q += u.D;
                    u.q %= heartPointsCount;
                    if (0 > u.q) {
                        u.q += heartPointsCount;
                    }
                }
            }
            
            u.vx += -dx / length * u.speed;
            u.vy += -dy / length * u.speed;
            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;
            u.vx *= u.force;
            u.vy *= u.force;
            
            for (k = 0; k < u.trace.length - 1;) {
                var T = u.trace[k];
                var N = u.trace[++k];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }
            
            for (k = 0; k < u.trace.length; k++) {
                var alpha = (k / u.trace.length) * 0.8;
                ctx.fillStyle = u.f.replace('0.8', alpha);
                ctx.fillRect(u.trace[k].x, u.trace[k].y, u.size, u.size);
            }
        }

        window.requestAnimationFrame(loop, canvas);
    };
    
    loop();
};

// Add touch events for mobile interaction
document.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById('heart');
    
    // Touch events for mobile
    if (window.isDevice) {
        canvas.addEventListener('touchstart', function(e) {
            e.preventDefault();
            // Add touch interaction here if needed
        }, { passive: false });
        
        canvas.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });
    }
    
    // Prevent context menu on long press
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
});

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);
