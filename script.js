function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class VCREffect {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.config = Object.assign({
            fps: 60,
            blur: 1,
            opacity: 1,
            miny: 220,
            miny2: 220,
            num: 70
        }, options);

        this.init();
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.opacity = this.config.opacity;

        this.generateVCRNoise();
        window.addEventListener("resize", () => this.onResize());
    }

    onResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    generateVCRNoise() {
        if (this.config.fps >= 60) {
            cancelAnimationFrame(this.vcrInterval);
            const animate = () => {
                this.renderTrackingNoise();
                this.vcrInterval = requestAnimationFrame(animate);
            };
            animate();
        } else {
            clearInterval(this.vcrInterval);
            this.vcrInterval = setInterval(() => {
                this.renderTrackingNoise();
            }, 1000 / this.config.fps);
        }
    }

    renderTrackingNoise(radius = 2) {
        const { canvas, ctx, config } = this;
        let { miny, miny2, num } = config;

        canvas.style.filter = `blur(${config.blur}px)`;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `#fff`;

        ctx.beginPath();
        for (let i = 0; i <= num; i++) {
            let x = Math.random() * canvas.width;
            let y1 = getRandomInt(miny += 3, canvas.height);
            let y2 = getRandomInt(0, miny2 -= 3);
            ctx.fillRect(x, y1, radius, radius);
            ctx.fillRect(x, y2, radius, radius);
            ctx.fill();

            this.renderTail(ctx, x, y1, radius);
            this.renderTail(ctx, x, y2, radius);
        }
        ctx.closePath();
    }

    renderTail(ctx, x, y, radius) {
        const n = getRandomInt(1, 50);
        const dirs = [1, -1];
        let dir = dirs[Math.floor(Math.random() * dirs.length)];

        for (let i = 0; i < n; i++) {
            let r = getRandomInt(radius - 0.01, radius);
            let dx = getRandomInt(1, 4) * dir;
            radius -= 0.1;
            ctx.fillRect((x += dx), y, r, r);
            ctx.fill();
        }
    }
}

// Initialize VCR Effect
const canvas = document.getElementById("canvas");
const vcrEffect = new VCREffect(canvas, {
    opacity: 1,
    miny: 220,
    miny2: 220,
    num: 70,
    fps: 60,
    blur: 1
});

// M3U8 Stream Configuration
const streamUrls = [
    "https://live.presstv.ir/hls/ifilmar.m3u8",
    // Add more M3U8 URLs here
    // "http://example.com/stream2.m3u8",
    // "http://example.com/stream3.m3u8"
];
let currentStreamIndex = 0;
const videoElement = document.getElementById("tv-video");
const snowEffect = document.querySelector(".snow-effect");
let hls = null;
let streamRotationInterval = null;

// Create channel changer button
function createChannelChanger() {
    const btn = document.createElement("div");
    btn.id = "channel-changer";
    btn.innerHTML = "CHANGE CHANNEL";
    btn.style.position = "absolute";
    btn.style.left = "10px";
    btn.style.top = "50%";
    btn.style.transform = "translateY(-50%)";
    btn.style.zIndex = "20";
    btn.style.padding = "10px 15px";
    btn.style.backgroundColor = "rgba(0,0,0,0.7)";
    btn.style.color = "#fff";
    btn.style.border = "2px solid #f00";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.fontFamily = "'Medula One', cursive";
    btn.style.fontSize = "1.5rem";
    btn.style.textShadow = "0 0 5px #f00";
    btn.addEventListener("click", switchToNextStream);
    
    document.body.appendChild(btn);
}

// Initialize HLS.js player
function initPlayer() {
    if (Hls.isSupported()) {
        hls = new Hls();
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            console.log("Video and HLS.js are now bound together");
        });
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log("Manifest loaded, found " + data.levels.length + " quality levels");
            videoElement.play();
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error("HLS Error:", data);
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.error("Fatal network error encountered, try to recover");
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.error("Fatal media error encountered, try to recover");
                        hls.recoverMediaError();
                        break;
                    default:
                        console.error("Unrecoverable error");
                        switchToNextStream();
                        break;
                }
            }
        });
    } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        videoElement.addEventListener("loadedmetadata", () => {
            videoElement.play();
        });
    } else {
        console.error("HLS is not supported in this browser");
    }
}

// Load a stream
function loadStream(url) {
    if (hls) {
        hls.loadSource(url);
        hls.attachMedia(videoElement);
    } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        videoElement.src = url;
    }
}

// Switch to next stream with static transition
function switchToNextStream() {
    // Clear any existing timeout to prevent multiple triggers
    clearTimeout(streamRotationInterval);
    
    snowEffect.style.opacity = 1;
    setTimeout(() => {
        currentStreamIndex = (currentStreamIndex + 1) % streamUrls.length;
        loadStream(streamUrls[currentStreamIndex]);
        snowEffect.style.opacity = 0;
        
        // Restart the auto-rotation timer
        startStreamRotation();
    }, 2000); // 2 seconds of static before switching
}

// Auto-switch streams every 20 seconds
function startStreamRotation() {
    // Clear any existing interval
    if (streamRotationInterval) {
        clearInterval(streamRotationInterval);
    }
    streamRotationInterval = setInterval(switchToNextStream, 20000);
}

// Initialize everything when the page loads
document.addEventListener("DOMContentLoaded", () => {
    initPlayer();
    createChannelChanger(); // Add the manual channel changer button
    
    if (streamUrls.length > 0) {
        loadStream(streamUrls[currentStreamIndex]);
        startStreamRotation();
    } else {
        console.error("No streams available in the playlist");
    }
});