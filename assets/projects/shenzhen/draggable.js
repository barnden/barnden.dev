class Draggable {
    constructor(draggable, parent, container) {
        if (!(draggable instanceof HTMLElement))
            throw "[Drag] Excpected HTMLElement for drag."

        if (!(parent instanceof HTMLElement))
            parent = draggable

        if (container instanceof HTMLElement)
            this.container = container

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

        let left = x
        let top = y

        if (this.container instanceof HTMLElement) {
            const box = this.parent.getBoundingClientRect()
            const container = this.container.getBoundingClientRect()
            const collision = this.detect(x, y)

            switch (collision & 5) {
                case 0:
                    this.previous[0] = cx
                    break
                case 1:
                    left = 0
                    break
                case 4:
                    left = container.width - box.width - 1
                    break
            }

            switch (collision & 10) {
                case 0:
                    this.previous[1] = cy
                    break
                case 2:
                    top = container.height - box.height - 1
                    break
                case 8:
                    top = 0
                    break
            }
        } else {
            this.previous = [cx, cy]
        }

        this.parent.style.left = `${left}px`
        this.parent.style.top = `${top}px`
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

    detect(x, y) {
        if (this.container == undefined)
            return 0

        const container = this.container.getBoundingClientRect()
        const box = this.parent.getBoundingClientRect()

        if (typeof (x) === "undefined" || typeof (y) === "undefined") {
            x = box.left - container.left
            y = box.top - container.top
        }

        const top = y < 0
        const right = x > (container.width - box.width)
        const bottom = y > (container.height - box.height)
        const left = x < 0

        return +top << 3 | +right << 2 | +bottom << 1 | +left
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
