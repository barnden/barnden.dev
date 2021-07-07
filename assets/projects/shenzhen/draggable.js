class Draggable {
    constructor(draggable, parent) {
        if (!(draggable instanceof HTMLElement))
            throw "[Drag] Excpected HTMLElement for drag."

        if (!(parent instanceof HTMLElement))
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

    static getCoordinates(e) {
        const coords = (typeof (e.touches) === "undefined") ? e : e.touches[0]

        return [coords.clientX, coords.clientY]
    }

    setup() {
        this.draggable.addEventListener("mousedown", this.start())
        this.draggable.addEventListener("touchstart", this.start())

        document.addEventListener("mouseup", this.stop())
        document.addEventListener("touchend", this.stop())
    }

    executeHooks(event, data) {
        let error = false

        // TODO: Should we early exit if error?
        if (this.hooks.hasOwnProperty(event) && this.hooks[event].length)
            for (let hook of this.hooks[event])
                if (typeof (hook) === "function")
                    error |= hook(data)

        return error
    }

    start() {
        if (this.start_handler != undefined)
            return this.start_handler

        this.start_handler = e => {
            e.preventDefault()

            // Only activate on left mouse click
            if (e.type != "touchstart" && e.buttons != 1)
                return

            // Don't apply drag twice
            if (this.parent.hasAttribute("data-dragged"))
                return

            if (this.executeHooks("mousedown", e))
                return

            this.onmousedown(e)
        }

        return this.start_handler
    }

    stop() {
        if (this.stop_handler != undefined)
            return this.stop_handler

        this.stop_handler = e => {
            if (!this.parent.hasAttribute("data-dragged"))
                return

            this.executeHooks("mouseup", e)

            this.parent.removeAttribute("data-dragged")

            document.removeEventListener("mousemove", this.drag())
            document.removeEventListener("touchmove", this.drag())
        }

        return this.stop_handler
    }

    drag() {
        if (this.drag_handler != undefined)
            return this.drag_handler

        this.drag_handler = e => {
            e.preventDefault()

            if (this.executeHooks("mousemove", e))
                return

            this.onmousemove(e)
        }

        return this.drag_handler
    }

    onmousedown(e) {
        this.previous = Draggable.getCoordinates(e)
        this.parent.setAttribute("data-dragged", "data-dragged")

        document.addEventListener("mousemove", this.drag())
        document.addEventListener("touchmove", this.drag())
    }

    onmousemove(e) {
        const [cx, cy] = Draggable.getCoordinates(e)
        const x = this.parent.offsetLeft - this.previous[0] + cx
        const y = this.parent.offsetTop - this.previous[1] + cy

        this.previous = [cx, cy]
        this.parent.style.left = x + "px"
        this.parent.style.top = y + "px"
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
