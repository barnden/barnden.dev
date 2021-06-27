'use strict';

let N = 100000

let attributes = {
    consts: [1.89],
    speed: 1 / 80,
    angles: [0.57828, 2.66421, 0.],
    scale: 3.,
    camera: [0, -0.5, 0],
    ortho: [-4.75, 4.75, -4.75, 4.75, -4.75, 4.75]
}

function install_input_handler() {
    const canvas = document.getElementById("attractor-demo")

    let mouse_down = false
    let shift_down = false
    let last = [0, 0]

    canvas.addEventListener("mousedown", e => {
        mouse_down = true
        last = [e.clientX, e.clientY]
    })

    document.addEventListener("mouseup", _ => mouse_down = false)
    document.addEventListener("mousemove", e => {
        if (!mouse_down)
            return;

        let deltaX = (last[0] - e.clientX) / 100
        let deltaY = (last[1] - e.clientY) / 100

        if (shift_down) {
            attributes.camera[0] += deltaX
            attributes.camera[1] += -deltaY
        } else {
            attributes.angles[0] += -deltaY
            attributes.angles[1] += deltaX
        }

        last = [e.clientX, e.clientY]
    })
    document.addEventListener("keydown", e => shift_down |= e.key.toLowerCase() === "shift")
    document.addEventListener("keyup", e => shift_down &= e.key.toLowerCase() !== "shift")
    document.addEventListener("blur", _ => shift_down = mouse_down = false)
}

function createShader(gl, type, name) {
    let shader = gl.createShader(type)
    let source = document.getElementById(name).text

    gl.shaderSource(shader, source.trimStart())
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw ("Something went wrong. (compilation)")

    return shader
}

function createProgram(gl, shaders, transformFeedbackVaryings) {
    let program = gl.createProgram()

    for (let shader of shaders)
        gl.attachShader(program, createShader(gl, ...shader));

    if (transformFeedbackVaryings)
        gl.transformFeedbackVaryings(
            program,
            transformFeedbackVaryings,
            gl.INTERLEAVED_ATTRIBS
        )

    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw "Something went wrong. (linking)"

    return program
}

function main() {
    const canvas = document.getElementById("attractor-demo")
    const gl = canvas.getContext("webgl2")

    if (!gl)
        return;

    install_input_handler()

    let feature = document.getElementById("attractor-feature")
    let feature_img = document.getElementById("attractor-feature-img")

    if (feature)
        feature.classList.remove("hidden")

    if (feature_img)
        feature_img.classList.add("hidden")

    const update_program = createProgram(
        gl,
        [
            [gl.VERTEX_SHADER, "update-vs"],
            [gl.FRAGMENT_SHADER, "update-fs"]
        ],
        ["v_Position"]
    )

    const render_program = createProgram(
        gl,
        [
            [gl.VERTEX_SHADER, "render-vs"],
            [gl.FRAGMENT_SHADER, "render-fs"]
        ]
    )

    const update_locations = {
        i_Position: gl.getAttribLocation(update_program, "i_Position"),
        u_Consts: gl.getUniformLocation(update_program, "u_Consts"),
        u_Speed: gl.getUniformLocation(update_program, "u_Speed"),
        u_RgbNoise: gl.getUniformLocation(update_program, "u_RgbNoise"),
    }

    const render_locations = {
        i_Position: gl.getAttribLocation(render_program, "i_Position"),
        u_Angles: gl.getUniformLocation(render_program, "u_Angles"),
        u_Camera: gl.getUniformLocation(render_program, "u_Camera"),
        u_Scale: gl.getUniformLocation(render_program, "u_Scale"),
        u_Ortho: gl.getUniformLocation(render_program, "u_Ortho")
    }

    // Generate 3 * N random floats in [0, 1]
    let positions = Float32Array.from(new Array(3 * N).fill(0).map(_ => Math.random()))

    let buffer = (data, usage) => {
        const buf = gl.createBuffer()

        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, data, usage)

        return buf
    }

    const position_buffers = [
        buffer(positions, gl.DYNAMIC_DRAW),
        buffer(positions, gl.DYNAMIC_DRAW)
    ]

    let vertexArray = pairs => {
        const va = gl.createVertexArray()

        gl.bindVertexArray(va)

        for (const [buf, loc] of pairs) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buf)
            gl.enableVertexAttribArray(loc)
            gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0)
        }

        return va
    }

    const update_vaos = position_buffers.map(v => vertexArray([[v, update_locations.i_Position]]))
    const render_vaos = position_buffers.map(v => vertexArray([[v, render_locations.i_Position]]))

    let transformFeedback = buf => {
        const feedback = gl.createTransformFeedback()

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, feedback)
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buf)

        return feedback
    }

    const feedbacks = position_buffers.map(v => transformFeedback(v))

    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null)

    let current = {
        update: update_vaos[0],
        feedback: feedbacks[1],
        render: render_vaos[1]
    }

    let next = {
        update: update_vaos[1],
        feedback: feedbacks[0],
        render: render_vaos[0]
    }

    const RGB_Noise = gl.createTexture()

    gl.bindTexture(gl.TEXTURE_2D, RGB_Noise)
    gl.texImage2D(
        gl.TEXTURE_2D, 0,
        gl.RGB8, 512, 512, 0, gl.RGB,
        gl.UNSIGNED_BYTE,
        Uint8ClampedArray.from(
            new Array(512 * 512 * 3).fill(0).map(_ => Math.random()),
            v => ~~(v * 0xFF)
        )
    )

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    let last = performance.now()
    const frame_time = 1000 / 60

    let render = _ => {
        const now = performance.now()
        const delta = now - last

        // Limit to 60 FPS
        if (delta < frame_time)
            return requestAnimationFrame(render)

        last = now - (delta % frame_time)

        gl.clearColor(0x16 / 0xFF, 0x16 / 0xFF, 0x1D / 0xFF, 1.)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.useProgram(update_program)
        gl.bindVertexArray(current.update)

        gl.uniform1fv(update_locations.u_Consts, attributes.consts)
        gl.uniform1f(update_locations.u_Speed, attributes.speed)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, RGB_Noise)
        gl.uniform1i(update_locations.u_RgbNoise, 0)

        gl.enable(gl.RASTERIZER_DISCARD)

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.feedback)
        gl.beginTransformFeedback(gl.POINTS)
        gl.drawArrays(gl.POINTS, 0, N)
        gl.endTransformFeedback()
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)

        gl.disable(gl.RASTERIZER_DISCARD)

        gl.useProgram(render_program)

        gl.uniform3f(render_locations.u_Angles, ...attributes.angles)
        gl.uniform3f(render_locations.u_Camera, ...attributes.camera)
        gl.uniform1f(render_locations.u_Scale, attributes.scale)
        gl.uniform1fv(render_locations.u_Ortho, attributes.ortho)

        gl.bindVertexArray(current.render)
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        gl.drawArrays(gl.POINTS, 0, N)

        current = [next, next = current][0]

        requestAnimationFrame(render)
    }

    requestAnimationFrame(render)
}

window.addEventListener("load", main)
