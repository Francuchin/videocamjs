class controladorVideoCamara {
    constructor(width, height) {
        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                height: height ? height : 1366,
                width: width ? width : 768,
                facingMode: "user"
            }
        }).then(stream => {
            let vc = document.querySelectorAll('VideoCamara')
            vc.forEach(vc => new VideoCamara(
                vc,
                stream,
                vc.getAttribute('width') ? vc.getAttribute('width') : 640,
                vc.getAttribute('height') ? vc.getAttribute('height') : 480))
        }).catch(err => console.log(err.name + ": " + err.message))
    }
}
class VideoCamara {
    constructor(_v, stream, width, height) {
        let self = this,
            canvas = document.createElement('canvas')
        canvas.oncontextmenu = e => e.preventDefault()
        _v.appendChild(canvas)
        self.c = canvas
        self.c.width = width
        self.c.height = height
        self.ctx = self.c.getContext("2d")
        self.w = width
        self.h = height

        self.detector = new objectdetect.detector(~~(60 * self.c.width / self.c.height), 60, 1.1, objectdetect.frontalface)

        self.fps = 15
        self.v = stream
        self.video = document.createElement('video')
        self.video.srcObject = self.v
        self.video.play()
        self.cara = []
        self.loop()
        console.log(self)
    }
    detectarCaras(f) {
        let self = this
        if (f) self.ctx.putImageData(f, 0, 0)
        return new Promise(ejecutar => ejecutar(self.detector.detect(self.c, 1)))
    }
    detectarCara(f) {
        let self = this
        if (f) self.ctx.putImageData(f, 0, 0)
        return new Promise((listo, error) => {
            self.cara = self.detector.detect(self.c, 1)
            self.cara = self.cara[0]
            if (self.cara == undefined || self.cara[0] == undefined) error(f)
            let x = self.cara[0] * self.c.width / self.detector.canvas.width,
                y = self.cara[1] * self.c.height / self.detector.canvas.height,
                w = self.cara[2] * self.c.width / self.detector.canvas.width,
                h = self.cara[3] * self.c.height / self.detector.canvas.height
            x += (w * 1.0 / 8)
            y += (h * 0.8 / 8)
            w *= 6 / 8
            h *= 6 / 8
            listo({
                f: f,
                x: x,
                y: y,
                w: w,
                h: h
            })
        })
    }
    espejar(f) {
        let self = this
        return new Promise(listo => {
            let frame = f || self.ctx.getImageData(0, 0, self.w, self.h),
                l = frame.data.length / 4
            for (let i = 0; i < frame.width / 2; i++)
                for (let j = 0; j < frame.height; j++) {
                    let pos = i + j * frame.width,
                        pos2 = frame.width - i + j * frame.width,
                        aux
                    for (let color = 0; color < 3; color++) {
                        aux = frame.data[pos * 4 + color]
                        frame.data[pos * 4 + color] = frame.data[pos2 * 4 + color]
                        frame.data[pos2 * 4 + color] = aux
                    }
                }
            listo(frame)
        })
    }
    fx_1(f) {
        let self = this
        return new Promise(listo => {
            let l = f.data.length / 4
            for (let i = 0; i < f.width / 2; i++)
                for (let j = 0; j < f.height; j++) {
                    let pos = i + j * f.width,
                        pos2 = f.width - i + j * f.width,
                        aux
                    aux = (f.data[pos * 4 + 0] + f.data[pos2 * 4 + 0]) / 2
                    f.data[pos * 4 + 0] = aux
                    f.data[pos2 * 4 + 0] = aux
                    aux = (f.data[pos * 4 + 1] + f.data[pos2 * 4 + 1]) / 2
                    f.data[pos * 4 + 1] = aux
                    f.data[pos2 * 4 + 1] = aux
                    aux = (f.data[pos * 4 + 2] + f.data[pos2 * 4 + 2]) / 2
                    f.data[pos * 4 + 2] = aux
                    f.data[pos2 * 4 + 2] = aux
                }
            listo(f)
        })
    }
    rectangulo(f, x, y, w, h, color, g) {
        let self = this
        return new Promise(listo => {
            let frame = f || self.ctx.getImageData(0, 0, self.w, self.h),
                l = frame.data.length / 4
            for (let i = 0; i < l; i++) {
                let _x = i % frame.width,
                    _y = (i - _x) / frame.width
                if (g) {
                    if (
                        (_y > y && _y < y + h + g &&
                            ((_x > x && _x < x + g) || (_x > x + w && _x < x + w + g))) ||
                        (_x > x && _x < x + w + g &&
                            ((_y > y && _y < y + g) || (_y > y + h && _y < y + h + g)))
                    ) {
                        if (color.r) frame.data[i * 4 + 0] = color.r
                        if (color.g) frame.data[i * 4 + 1] = color.g
                        if (color.b) frame.data[i * 4 + 2] = color.b
                        if (color.a) frame.data[i * 4 + 3] = color.a
                    }
                } else if (_y > y && _y < y + h && _x > x && _x < x + w) {
                    if (color.r) frame.data[i * 4 + 0] = color.r
                    if (color.g) frame.data[i * 4 + 1] = color.g
                    if (color.b) frame.data[i * 4 + 2] = color.b
                    if (color.a) frame.data[i * 4 + 3] = color.a
                }
            }
            listo(frame)
        })
    }
    rgb(r, g, b, a) {
        return {
            r: r,
            g: g,
            b: b,
            a: a
        }
    }
    procesarImagen() {
        let self = this
        self.espejar().then(f =>
            self.detectarCara(f).then(c => {
                self.rectangulo(c.f, c.x, c.y, c.w, c.h, self.rgb(
                    Math.random() * 255 + 1,
                    Math.random() * 255 + 1,
                    Math.random() * 255 + 1
                ), 5).then(f =>
                    self.ctx.putImageData(f, 0, 0)
                )
            }).catch(f => self.ctx.putImageData(f, 0, 0)))
    }
    loop() {
        let self = this
        self.ctx.drawImage(self.video, 0, 0, self.w, self.h)
        self.procesarImagen()
        setTimeout(() => self.loop(), 1000 / self.fps)
    }
}
document.body.onload = e => new controladorVideoCamara()