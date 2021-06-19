function curl_animation() {
    particle({
        canvas_name: "curl-demo",
        func: "curl",
        scale: 8,
        particle_count: 128,
        opt: [[8e-4, 8e-4]],
        time: 6000,
        queue_hook: q => q.map((e, i) => [i, ...e.pos]),
        noise_hook: data => [data.splice(0, 1)[0], data],
        move_hook: vec => vec.map(e => e / 10)
    })()
}

function perlin_animation() {
    particle({
        canvas_name: "perlin-demo",
        func: "perlin",
        scale: 8,
        particle_count: 128,
        time: 6000,
        queue_hook: q => {
            let pos = []

            q.forEach((p, i) => {
                pos.push([i, ...p.pos])
                pos.push([i, p.pos[0] + Math.E, p.pos[1] + Math.PI])
            })

            return pos
        },
        noise_hook: data => {
            let c = data.splice(0, 2)

            return [[c[0][0], [c[0][1], c[1][1]]], data]
        },
        move_hook: vec => vec.map(e => e / 5)
    })()
}

function curl_flow_animation() {
    particle({
        canvas_name: "curl-flow-demo",
        func: "curl",
        scale: 2.5,
        particle_count: 512,
        opt: [[8e-4, 8e-4]],
        time: 6000,
        queue_hook: q => q.map((e, i) => [i, ...e.pos]),
        noise_hook: data => [data.splice(0, 1)[0], data],
        move_hook: vec => vec.map(e => e / 20),
        draw_hook: (context, vec) => {
            let deg = Math.atan2(vec[1], vec[0])

            deg = (deg > 0 ? deg : (Math.PI * 2 + deg)) * 360 / (2 * Math.PI)
            context.strokeStyle = `hsl(${~~deg}, 100%, 50%)`
        },
        frame_hook: (canvas, context) => context.fillRect(0, 0, canvas.width, canvas.height)
    })()
}

curl_animation()
curl_flow_animation()
perlin_animation()
generate_perlin()
generate_fbm()
generate_curl()

document.getElementById("curl-restart").addEventListener("click", curl_animation)
document.getElementById("curl-flow-restart").addEventListener("click", curl_flow_animation)
document.getElementById("perlin-restart").addEventListener("click", perlin_animation)
document.getElementById("demo-restart").addEventListener("click", _ => {
    generate_perlin()
    setTimeout(generate_fbm(), 100)
    setTimeout(generate_curl(), 200)
})

function generate_perlin() {
    let canvas = document.getElementById("demo-perlin")
    let context = canvas.getContext("2d")
    let img = context.getImageData(0, 0, canvas.clientWidth, canvas.height)

    context.clearRect(0, 0, canvas.width, canvas.height)

    let p = [...new Array(256).keys()]
        .map((v, _, a, j = random(255)) => [a[j], a[j] = v][0])
    let pl = new Perlin(new Array(512).fill(0)
        .map((_, i) => p[i & 255]), random_float() * random(256))

    generate_demo((x, y) => pl.get(x, y), img, canvas, context)
}

function generate_fbm() {
    let canvas = document.getElementById("demo-fbm")
    let context = canvas.getContext("2d")
    let img = context.getImageData(0, 0, canvas.clientWidth, canvas.height)

    context.clearRect(0, 0, canvas.width, canvas.height)

    let p = [...new Array(256).keys()]
        .map((v, _, a, j = random(255)) => [a[j], a[j] = v][0])
    let pl = new FBM(new Array(512).fill(0)
        .map((_, i) => p[i & 255]), random_float() * random(256))

    generate_demo((x, y) => pl.fbm(x, y), img, canvas, context)
}

function generate_curl() {
    let canvas = document.getElementById("demo-curl")
    let context = canvas.getContext("2d")

    context.clearRect(0, 0, canvas.width, canvas.height)

    let p = [...new Array(256).keys()]
        .map((v, _, a, j = random(255)) => [a[j], a[j] = v][0])
    let pl = new Curl(new Array(512).fill(0)
        .map((_, i) => p[i & 255]), random_float() * random(256))

    context.strokeStyle = "#FFF"
    context.lineWidth = 1.5

    for (let i = 0; i < 26; i++)
        for (let j = 0; j < 26; j++) {
            let x = i * canvas.width / 25
            let y = j * canvas.height / 25

            let result = pl.get(i, j)
            let deg = Math.atan2(result[1], result[0])

            deg = (deg > 0 ? deg : (Math.PI * 2 + deg)) * 360 / (2 * Math.PI)

            let cos = 8 * Math.cos(deg)
            let sin = 8 * Math.sin(deg)

            context.strokeStyle = `hsl(${deg}, 100%, 50%)`
            context.beginPath()
            context.moveTo(x - cos, y - sin)
            context.lineTo(x + cos, y + sin)
            context.stroke()
        }
}

function generate_demo(func, img, canvas, context) {
    for (let j = 0; j < canvas.width * canvas.height; j++) {
        let x = (j % canvas.width) / canvas.width * 6
        let y = (j / canvas.width) / canvas.height * 6

        let i = j * 4
        let magnitude = func(x, y)
        let intensity = Math.floor(255 / (1 + Math.exp(-2.5 * magnitude)))

        img.data[i] = img.data[i + 1] = img.data[i + 2] = intensity
        img.data[i + 3] = 255
    }

    context.putImageData(img, 0, 0)
}
