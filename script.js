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

// === STREAM SETUP ===
const canvas = document.getElementById("canvas");
const vcrEffect = new VCREffect(canvas, {
    opacity: 1,
    miny: 220,
    miny2: 220,
    num: 70,
    fps: 60,
    blur: 1
});

const streamUrls = [
    { type: "hls", url: "https://itpolly.iptv.digijadoo.net/live/btv_world/chunks.m3u8" },
    { type: "hls", url: "https://dzkyvlfyge.erbvr.com/PeaceTvEnglish/index.m3u8" },
    { type: "hls", url: "https://dzkyvlfyge.erbvr.com/PeaceTvUrdu/index.m3u8" },
    { type: "hls", url: "https://boishakhi.sonarbanglatv.com/boishakhi/boishakhitv/index.m3u8" },
    { type: "hls", url: "https://ap02.iqplay.tv:8082/iqb8002/d33ntv/playlist.m3u8" },
    { type: "hls", url: "https://live.presstv.ir/hls/ifilmar.m3u8" },
    { type: "hls", url: "https://d35j504z0x2vu2.cloudfront.net/v1/manifest/0bc8e8376bd8417a1b6761138aa41c26c7309312/bollywood-hd/960eed04-3c1a-4ad7-87dd-7b64f78d0b0c/2.m3u8" },
    { type: "youtube", url: "HRYSQ90PZDY" }
];

let currentStreamIndex = 0;
const videoElement = document.getElementById("tv-video");
const snowEffect = document.querySelector(".snow-effect");
const glitchEffect = document.querySelector(".glitch");
const tvContainer = document.querySelector(".tv-container");
let hls = null;

// === YOUTUBE SETUP ===
const youtubeIframe = document.createElement("iframe");
youtubeIframe.style.display = "none";
youtubeIframe.style.width = "100%";
youtubeIframe.style.height = "100%";
youtubeIframe.setAttribute("frameborder", "0");
youtubeIframe.setAttribute("allow", "autoplay");
youtubeIframe.setAttribute("allowfullscreen", "1");
tvContainer.appendChild(youtubeIframe);

// === CHANNEL BUTTON ===
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

// === HLS INITIALIZATION ===
function initPlayer() {
    if (Hls.isSupported()) {
        hls = new Hls();
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            console.log("Video and HLS.js are now bound together");
        });
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log("Manifest loaded, found " + data.levels.length + " quality levels");
            videoElement.play();
            hideEffects();
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error("HLS Error:", data);
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        hls.recoverMediaError();
                        break;
                    default:
                        switchToNextStream();
                        break;
                }
            }
        });
    } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        videoElement.addEventListener("loadedmetadata", () => {
            videoElement.play();
            hideEffects();
        });
    } else {
        console.error("HLS is not supported in this browser");
    }
}

function hideEffects() {
    setTimeout(() => {
        snowEffect.style.opacity = 0;
        glitchEffect.style.opacity = 0;
    }, 500);
}

// === STREAM LOADING ===
function loadStream(stream) {
    glitchEffect.style.opacity = 1;
    snowEffect.style.opacity = 1;

    if (stream.type === "hls") {
        youtubeIframe.style.display = "none";
        videoElement.style.display = "block";
        videoElement.muted = false; // 👈 UNMUTE HLS
        videoElement.volume = 1.0;

        if (hls) {
            hls.loadSource(stream.url);
            hls.attachMedia(videoElement);
        } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
            videoElement.src = stream.url;
        }
    } else if (stream.type === "youtube") {
        videoElement.style.display = "none";
        youtubeIframe.style.display = "block";
        // 🔊 Removed mute=1 to enable sound
        youtubeIframe.src = `https://www.youtube.com/embed/${stream.url}?autoplay=1&enablejsapi=1`;

        setTimeout(hideEffects, 2000);
    }
}

function switchToNextStream() {
    glitchEffect.style.opacity = 1;
    snowEffect.style.opacity = 1;

    if (youtubeIframe.style.display === "block") {
        youtubeIframe.src = "";
    } else {
        videoElement.pause();
    }

    setTimeout(() => {
        currentStreamIndex = (currentStreamIndex + 1) % streamUrls.length;
        loadStream(streamUrls[currentStreamIndex]);
    }, 2000);
}

document.addEventListener("DOMContentLoaded", () => {
    initPlayer();
    createChannelChanger();

    glitchEffect.style.opacity = 0;
    snowEffect.style.opacity = 0;

    if (streamUrls.length > 0) {
        loadStream(streamUrls[currentStreamIndex]);
    } else {
        console.error("No streams available in the playlist");
    }
});
