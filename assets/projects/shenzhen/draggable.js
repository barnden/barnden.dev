class Draggable {
    constructor (interactive, parent) {
        if (!(interactive instanceof Element))
            throw new Exception("[Drag] Expected HTML Element.")

        // Assume entire element is draggable.
        if (parent == undefined)
            parent = interactive

        this.previous = [0,0]
        this.draggable = interactive
        this.parent = parent
        this.hooks = { mouseup: [], mousemove: [], mousedown: [] }

        this.setup()
    }

    setup() {
        this.draggable.addEventListener("mousedown", this.start)
        this.draggable.addEventListener("touchstart", this.start)

        document.addEventListener("mouseup", this.stop)
        document.addEventListener("touchend", this.stop)
    }

    start = e => {
        e.preventDefault()

        // only activate on lmb
        if (e.buttons != 1 && typeof e.touches == "undefined")
            return

        // don't double drag
        if (this.parent.hasAttribute("data-dragged"))
            return

        let cancel = false

        if (this.hooks.mousedown.length)
            for (let cb of this.hooks.mousedown)
                cancel |= typeof(cb) == "function" ? cb(e) : 0

        if (cancel) return

        this.onmousedown(e)
    }

    stop = e => {
        if (this.parent.hasAttribute("data-dragged")) {
            if (this.hooks.mouseup.length)
                for (let cb of this.hooks.mouseup)
                    if (typeof(cb) === "function")
                        cb(e)

            this.parent.removeAttribute("data-dragged")

            document.removeEventListener("mousemove", this.drag)
            document.removeEventListener("touchmove", this.drag)
        }
    }

    drag = e => {
        e.preventDefault()

        let cancel = false

        if (this.hooks.mousemove.length)
            for (let cb of this.hooks.mousemove)
                cancel |= typeof(cb) == "function" ? cb(e) : 0

        if (cancel)
            return

        this.onmousemove(e)
    }

    onmousedown(e) {
        this.previous = e.type == "touchstart" ?
            [e.touches[0].clientX, e.touches[0].clientY] :
            [e.clientX, e.clientY]
        this.parent.setAttribute("data-dragged", "data-dragged")

        document.addEventListener("mousemove", this.drag)
        document.addEventListener("touchmove", this.drag)
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

        this.draggable.removeEventListener("mousedown", this.start)
        this.draggable.removeEventListener("touchstart", this.start)
        document.removeEventListener("mouseup", this.stop)
        document.removeEventListener("touchend", this.stop)
        document.removeEventListener("mousemove", this.drag)
        document.removeEventListener("touchmove", this.drag)
    }

    add_hook(event, cb) { if (this.hooks.hasOwnProperty(event)) this.hooks[event].push(cb) }
    remove_hook(event, cb) {
        if (this.hooks.hasOwnProperty(event))
            if (this.hooks[event].includes(cb))
                this.hooks[event].splice(this.hooks[event].indexOf(cb), 1)
    }
}
