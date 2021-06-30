class Draggable {
    constructor(draggable, parent) {
        if (!(draggable instanceof HTMLElement))
            throw "[Drag] Excpected HTMLElement for drag."

        if (parent == undefined)
            parent = draggable

        this.prev = [0, 0]
        this.draggable = draggable
        this.parent = parent

        this.hooks = {
            mouseup: [],
            mousemove: [],
            mousedown: []
        }

        this.setup()
    }

    setup() {
        this.draggable.addEventListener("mousedown", this.start())
        this.draggable.addEventListener("touchstart", this.start())

        document.addEventListener("mouseup", this.stop())
        document.addEventListener("touchend", this.stop())
    }

    start() {
        if (this.start_handler != undefined)
            return this.start_handler

        this.start_handler = e => {
            e.preventDefault()

            // Only activate on left mouse click
            if (e.buttons != 1 && typeof e.touches == "undefined")
                return

            // Don't apply drag twice
            if (this.parent.hasAttribute("data-dragged"))
                return

            if (this.hooks.mousedown.length)
                for (let callback of this.hooks.mousedown)
                    if (typeof(callback) !== "function" || callback(e))
                        return

            this.onmousedown(e)
        }

        return this.start_handler
    }

    stop() {
        if (this.stop_handler != undefined)
            return this.stop_handler

        this.stop_handler = e => {
            if (this.parent.hasAttribute("data-dragged")) {
                if (this.hooks.mouseup.length)
                    for (let callback of this.hooks.mouseup)
                        if (typeof (callback) === "function")
                            callback(e)

                this.parent.removeAttribute("data-dragged")

                document.removeEventListener("mousemove", this.drag())
                document.removeEventListener("touchmove", this.drag())
            }
        }

        return this.stop_handler
    }

    drag() {
        if (this.drag_handler != undefined)
            return this.drag_handler

        this.drag_handler = e => {
            e.preventDefault()

            if (this.hooks.mousemove.length)
                for (let callback of this.hooks.mousemove)
                    if (typeof(callback) !== "function" || callback(e))
                        return

            this.onmousemove(e)
        }

        return this.drag_handler
    }

    onmousedown(e) {
        this.previous = e.type == "touchstart" ?
            [e.touches[0].clientX, e.touches[0].clientY] :
            [e.clientX, e.clientY]
        this.parent.setAttribute("data-dragged", "data-dragged")

        document.addEventListener("mousemove", this.drag())
        document.addEventListener("touchmove", this.drag())
    }

    onmousemove(e) {
        let cx = e.clientX
        let cy = e.clientY

        if (e.type == "touchmove") {
            cx = e.touches[0].clientX
            cy = e.touches[1].clientY
        }

        const x = this.parent.offsetLeft - this.previous[0] + cx
        const y = this.parent.offsetTop - this.previous[1] + cy

        let left = x + "px"
        let top = y + "px"

        this.previous = [cx, cy]
        this.parent.style.left = left
        this.parent.style.top = top
    }

    remove(hooks = true) {
        // Remove drag handler from item

        if (hooks)
            this.hooks = { mouseup: [], mousemove: [], mousedown: [] }

        this.draggable.removeEventListener("mousedown", this.start())
        this.draggable.removeEventListener("touchstart", this.start())
        document.removeEventListener("mouseup", this.stop())
        document.removeEventListener("touchend", this.stop())
        document.removeEventListener("mousemove", this.drag())
        document.removeEventListener("touchmove", this.drag())
    }

    add_hook(event, callback) {
        if (this.hooks.hasOwnProperty(event))
            this.hooks[event].push(callback)
    }

    remove_hook(event, callback) {
        if (this.hooks.hasOwnProperty(event) && this.hooks[event].includes(callback))
            this.hooks[event].splice(this.hooks[event].indexOf(callback), 1)
    }
}
