const MAX_INT = new Uint32Array(1).fill(-1)[0] + 1
const BIN_OFFSET = 175
const CARD_OFFSET = 28

let fast = false

function random(min, max, safe = false) {
    if (max == undefined) {
        max = min
        min = 0
    }

    let val = Math.random() * (max - min + 1) + min

    return safe ? Math.trunc(val) : ~~val
}

function get(id) {
    return document.getElementById(`sh-${id}`)
}

class Card {
    constructor(color, number, container) {
        this.color = color
        this.number = number
        this.container = container
        this.draggable = true
        this.focus = 0

        this.handlers = {
            mousemove: undefined,
            mouseup: undefined
        }

        this.generate_card()
    }

    attach(column, move = true, x = 0, y = 0) {
        this.col = column
        this.parent = column.element
        this.parent.appendChild(this.card)

        this.initial = [
            x + this.parent.offsetLeft + ~~((
                this.parent.getBoundingClientRect().width -
                this.card.getBoundingClientRect().width
            ) / 2),
            y + CARD_OFFSET * (this.col.count - 1) + BIN_OFFSET + 10
        ]

        if (move)
            [this.x, this.y] = this.initial

        this.focus = this.z = column.focus

        this.handlers = {
            mousemove: column.drag,
            mouseup: column.lift
        }

        if (this.handlers.mousemove != undefined)
            this.drag.add_hook("mousemove", this.handlers.mousemove)
    }

    detach() {
        if (this.parent == undefined)
            return

        this.parent.removeChild(this.card)
        this.drag.remove_hook("mousemove", this.handlers.mousemove)

        this.initial = [0, 0]
        this.handlers.mousemove = undefined
    }

    move(col, verify = false, offset_x = 0, offset_y = 0) {
        if (!(col instanceof Column))
            return false

        if (!verify || col.verify(this)) {
            let slide = col.element != this.parent.element

            this.col.remove(this)
            col.add(this, false, offset_x, offset_y)

            if (slide)
                this.slide.bind(this)(...this.initial, this.focus)

            return true
        }

        return false
    }

    reattach() {
        if (this.handlers.mouseup == undefined)
            return false

        let cols = this.handlers.mouseup()

        if (!cols.length)
            return false

        let children = this.children.slice()
        let move_success = this.move(cols[0], true)

        if (children.length && move_success)
            children.forEach(child => child.move(cols[0], true))

        return move_success
    }

    slide(x, y, z) {
        let xn = x - this.card.offsetLeft
        let yn = y - this.card.offsetTop

        if ((xn + yn) == 0)
            return this.z = z

        this.card.style.transform = `translate(${xn}px,${yn}px)`
        this.card.style.transition = `transform ${.15 * (fast ? .5 : 1)}s ease`

        setTimeout(_ => {
            this.card.style.transform = null
            this.card.style.transition = null

            this.z = z
            this.x = x
            this.y = y
        }, (fast ? .5 : 1) * 130)
    }

    generate_card() {
        let card = document.createElement("div")
        let drag = new Draggable(card)

        card.classList.add("card")
        card.classList.add(this.color)
        card.classList.add("card-" + this.number)

        if (this.container)
            drag.container = this.container

        drag.add_hook("mouseup", _ => {
            if (this.reattach())
                return false

            this.slide.bind(this)(...this.initial, this.focus)

            if (this.children.length)
                this.children.forEach(
                    child => child.slide.bind(child)(...child.initial, child.focus)
                )

            return false
        })

        drag.add_hook("mousedown", _ => {
            if (!this.draggable)
                return true

            this.z++

            if (this.children.length)
                this.children.forEach(child => child.z++)

            return false
        })

        drag.add_hook("mousemove", _ => {
            if (!this.children.length)
                return false

            this.children.forEach((child, i) => {
                child.x = this.x
                child.y = this.y + CARD_OFFSET * (i + 1)
                child.z = this.z
            })

            return false
        })

        this.drag = drag
        this.card = card
    }

    set x(v) { this.card.style.left = v + "px" }
    set y(v) { this.card.style.top = v + "px" }
    set z(v) { this.card.style.zIndex = v }

    get x() { return parseInt(this.card.style.left) || 0 }
    get y() { return parseInt(this.card.style.top) || 0 }
    get z() { return parseInt(this.card.style.zIndex) || 0 }

    get children() {
        if (this.col == undefined || !this.col.count)
            return []

        return this.col.cards.slice(this.col.cards.indexOf(this) + 1, this.col.count)
    }
}

class Column {
    constructor(id, rules, focus, drag, lift, check) {
        this.element = document.createElement("div")
        this.element.classList.add("col")

        this.id = id || 0
        this.rules = rules
        this.focus = focus
        this.drag = drag
        this.lift = lift
        this.check = check

        this.cards = []
    }

    add(card, move, offset_x = 0, offset_y = 0) {
        if (!(card instanceof Card))
            return

        for (let card of this.cards)
            card.draggable = false

        this.cards.push(card)
        card.attach(this, move, offset_x, offset_y)

        this.detect()
    }

    remove(v) {
        if (!(v instanceof Card)) return

        if (this.cards.includes(v)) {
            this.cards.splice(this.cards.indexOf(v), 1)

            if (this.last != undefined)
                this.last.draggable = true

            v.detach()
            setTimeout(this.check, 20)
            this.detect()
        }
    }

    detect() {
        if (this.count <= 1) return

        for (let i = this.count - 1; i > 0; i--) {
            if (!this.verify(this.cards[i], this.cards[i - 1]))
                break

            this.cards[i - 1].draggable = true
        }
    }

    verify(v, n = this.last) {
        if (!this.count)
            return true

        let state = true

        if (this.rules[n.number])
            state &= !(
                this.rules[n.number].includes(v.number) ||
                this.rules[n.number].includes("*")
            )

        state &= this.rules[v.color] != n.color &&
            (parseInt(v.number) || MAX_INT) == (parseInt(n.number) || MAX_INT) - 1

        return state
    }

    get count() {
        return this.cards.length
    }

    get last() {
        if (!this.count)
            return undefined

        return this.cards[this.count - 1]
    }
}

class Tray extends Column {
    constructor(id, focus, drag, lift, check) {
        super(id, {}, focus, drag, lift, check)
    }

    add(v, move, offset_x = 0, offset_y = 0) {
        super.add(v, move, offset_x, -BIN_OFFSET + offset_y)
    }

    verify(v) {
        return !(this.count + v.children.length)
    }
}

class Bin extends Column {
    constructor(id, focus, drag, lift, check) {
        super(id, {}, focus, drag, lift, check)
    }

    add(v, move, offset_x = 0, offset_y = 0) {
        super.add(v, move, offset_x, -BIN_OFFSET - this.count * CARD_OFFSET + offset_y)
        v.drag.remove()
    }

    verify(v) {
        let num = parseInt(v.number) || MAX_INT

        if (num > 9 || v.children.length)
            return false

        if (this.count)
            return this.last.color == v.color &&
                (parseInt(this.last.number) || MAX_INT) == (num - 1)
        else
            return num == 1
    }
}

class FlowerBin extends Column {
    constructor(id, focus, drag, lift) {
        super(id, {}, focus, drag, lift)

        this.element.classList.add("flower")
    }

    add(v, move) {
        super.add(v, move, 0, -BIN_OFFSET)
        v.drag.remove()
    }

    verify(v) {
        return v.number == 'f'
    }
}

function game_win() {
    if (game.won)
        return

    const board = get("shenzhen")
    const popup = document.createElement("div")

    popup.classList.add("sh-popup")
    popup.classList.add("win")
    popup.innerHTML = `<div>you win.</div>`

    board.appendChild(popup)

    game.won = true
}

class Shenzhen {
    constructor() {
        this.board = get("shenzhen")
        this.trays = get("trays")
        this.bins = get("bins")

        this.cards = []

        this.rules = {
            // rules define the set of exclusions
            "red": "red",
            "green": "green",
            "black": "black",
            "f": "*",
            "10": "*",
            "11": "*",
            "12": "*",
            "13": "*",
        }

        get("fast").addEventListener("change", e => fast = e.target.checked)
        get("colorblind").addEventListener("change", e => this.colorblind = e.target.checked)
    }

    generate_cards() {
        let colors = ["red", "green", "black"]
        let cards = [new Card(colors[0], 'f', this.board)]

        for (let i = 0; i < 39; i++) {
            let color = colors[~~(i / 13)]
            let number = i % 13 + 1

            cards.push(new Card(color, number, this.board))
        }

        for (let j = 39, g = random(39); j > 0; j--, g = random(39))
            [cards[g], cards[j]] = [cards[j], cards[g]]

        cards.forEach((card, index) => this.columns[index % 8].add(card))
    }

    generate_columns() {
        this.columns = []

        let params = [0, this.drag.bind(this), this.lift.bind(this), this.check.bind(this)]

        for (let i = 0; i < 8; i++) {
            let col = new Column(i, this.rules, ...params)
            this.columns.push(col)
            this.board.appendChild(col.element)
        }

        for (let i = 8; i < 11; i++) {
            let tray = new Tray(i, ...params)
            this.columns.push(tray)
            this.trays.appendChild(tray.element)
        }

        let flower_bin = new FlowerBin(11, ...params)
        this.columns.push(flower_bin)
        this.bins.appendChild(flower_bin.element)

        for (let i = 12; i < 15; i++) {
            let bin = new Bin(i, ...params)
            this.columns.push(bin)
            this.bins.appendChild(bin.element)
        }
    }

    drag(e) {
        for (let el of document.elementsFromPoint(e.clientX, e.clientY))
            if (Array.from(el.classList).includes("col") && this.focused != el)
                this.focused = el
    }

    lift() {
        if (this.focused == undefined)
            return []

        let focused = [this.focused, this.focused = undefined][0]

        return this.columns.filter(col => col.element == focused)
    }

    check() {
        if (this.moves) return

        let empty = 0
        let dragons = {
            "red": [],
            "green": [],
            "black": []
        }

        for (let i = 0; i < 11; i++) {
            let col = this.columns[i]

            if (i < 8 && !col.count) {
                ++empty
                continue
            }

            if (col.count) {
                let bins = this.columns.slice(12, 15)
                let min = bins.reduce(
                    (acc, cur) =>
                        Math.min(acc, cur.last ? (parseInt(cur.last.number) || MAX_INT) : 0)
                    , MAX_INT)
                let last = col.last

                // If we move a card, we stop execution of the function.
                // On move, the remove function will be called, which
                // calls this function again.
                if (last.number > 9)
                    dragons[last.color].push(i)

                // Automatically move flower card to flower bin
                if (last.number == 'f') {
                    last.move(this.columns[11])
                    return
                }

                // Always move a 1 or 2 to a bin, or whenever the
                // current card is one above the minimum of all 3 bins
                if (last.number <= 2 || last.number == min + 1)
                    for (let bin of bins) {
                        if (bin.verify(last)) {
                            last.draggable = false
                            setTimeout(_ => last.move(bin), ((fast ? .5 : 1) * 130) + 5)
                            return
                        }
                    }
            }
        }

        this.check_dragon(dragons)

        if (empty == 8)
            game_win()
    }

    check_dragon(dragons) {
        this.dragons = dragons

        const trays = this.columns.slice(8, 11)
        for (let [dragon, cols] of Object.entries(dragons)) {
            if (cols.length < 4)
                continue

            let available = trays.reduce((acc, cur, ind) =>
                Math.min(
                    acc,
                    cur.count ?
                        cur.last.color == dragon && cur.last.number > 9 ?
                            ind :
                            MAX_INT :
                        ind
                ), MAX_INT
            )

            for (let i of cols) {
                let col = this.columns[i]

                if (!col.last || col.last.number < 10 || col.last.color != dragon) {
                    available = MAX_INT
                    break
                }
            }

            this.update_buttons(dragon, available)
        }
    }

    update_buttons(dragon, available) {
        let button = get("dragon-" + dragon)

        if (available != MAX_INT) {
            button.removeAttribute("disabled")

            button.onclick = _ => {
                button.setAttribute("disabled", "disable")
                this.collect(dragon, available)
            }

            button.ontouchstart = e => {
                button.setAttribute("disabled", "disable")
                this.collect(dragon, available)

                e.stopPropagation()
                e.preventDefault()
                e.handled = true
            }
        } else {
            button.setAttribute("disabled", "disabled")

            button.onclick = null
            button.ontouchstart = null
        }
    }

    collect(dragon, available) {
        if (this.dragons[dragon].length != 4)
            return

        let movable = true

        for (let index of this.dragons[dragon]) {
            let column = this.columns[index]

            movable = movable &&
                !!column.count &&
                column.last.color == dragon &&
                parseInt(column.last.number || 0) > 9
        }

        if (!movable)
            return

        for (let i in this.dragons[dragon]) {
            let card = this.columns[this.dragons[dragon][i]].last
            let tray = this.columns[8 + available]

            card.move(tray, false, 0, -tray.count * CARD_OFFSET)
            card.drag.remove()
            card.card.classList.add("flip")
        }
    }

    restart() {
        let popups = Array.from(document.getElementsByClassName("sh-popup"))

        if (popups.length)
            for (let popup of popups)
                popup.remove()

        this.cards = []
        this.won = false

        if (this.columns)
            this.columns.forEach(col => col.element.remove())

        this.generate_columns()
        this.generate_cards()
        this.check()
    }

    reposition() {
        for (let column of this.columns) {
            if (!column.count)
                continue

            for (let card of column.cards)
                card.x = card.initial[0] = card.parent.offsetLeft + ~~((
                    card.parent.getBoundingClientRect().width -
                    card.card.getBoundingClientRect().width
                ) / 2)
        }
    }

    set colorblind(v) {
        let red = get("dragon-red")
        let green = get("dragon-green")

        if (v) {
            this.board.classList.add("colorblind")
            red.innerHTML = "BLU"
            green.innerHTML = "YEL"
        } else {
            this.board.classList.remove("colorblind")
            red.innerHTML = "RED"
            green.innerHTML = "GRN"
        }
    }
}

let game = new Shenzhen()

window.addEventListener("load", game.restart.bind(game))
window.addEventListener("resize", game.reposition.bind(game))
