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

// Usage
const canvas = document.getElementById("canvas");
const vcrEffect = new VCREffect(canvas, {
    opacity: 1,
    miny: 220,
    miny2: 220,
    num: 70,
    fps: 60,
    blur: 1
});
const videoIds = ["c4CVKbVtTsc", "143aXLat70E", "J5SSsT1O9gE", "dAiomIGB3qo", "lk6iJNSv-vY", "7PgJLyeb6sM", "wz0A7m1euy0"];
let currentVideoIndex = 0;
const iframe = document.getElementById("ytplayer");
const snowEffect = document.querySelector(".snow-effect");

function switchToNextVideo() {
  snowEffect.style.opacity = 1;
  setTimeout(() => {
    currentVideoIndex = (currentVideoIndex + 1) % videoIds.length;
    iframe.src = `https://www.youtube.com/embed/${videoIds[currentVideoIndex]}?autoplay=1&controls=0&loop=1&mute=1`;
    snowEffect.style.opacity = 0;
  }, 2000); // 2 seconds of static before switching
}

iframe.addEventListener("load", () => {
  setTimeout(switchToNextVideo, 20000); 
});