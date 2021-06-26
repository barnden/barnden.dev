function install_input_handler() {
    console.log('hi')
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
}

window.addEventListener("load", install_input_handler)
