let ms = (() => {
    let board = get("board")

    function random(min, max, safe = false) {
        if (max == undefined) {
            max = min
            min = 0
        }

        let val = Math.random() * (max - min + 1) + min

        return safe ? Math.trunc(val) : ~~val
    }

    function get(id) {
        return document.getElementById(`ms-${id}`)
    }

    const colors = [
        null,      // empty
        "#3F88C5", // 1
        "#679271", // 2
        "#B44557", // 3
        "#A06A8F",  // 4
        "#B80050",  // 5
        "#208082", // 6
        "#DFE2E9", // 7
        "#686868"  //8
    ]

    const difficulties = [
        [8, 10, 10, false],  // Easy
        [14, 18, 40, false], // Medium
        [20, 24, 99, true]   // Hard
    ]

    function get_neighbours(i) {
        // Get the 8 neighbouring squares
        let adj = [
            i - COLS - 1, i - COLS, i - COLS + 1,
            i - 1,      /* i */     i + 1,
            i + COLS - 1, i + COLS, i + COLS + 1
            // Remove if out of bounds
        ].map(x => x < 0 ? null : x >= (ROWS * COLS) ? null : x)

        // More conditionals to check if out of wrapping to new line
        if (i % COLS <= 0)
            adj[0] = adj[3] = adj[5] = null

        if (i % COLS == COLS - 1)
            adj[2] = adj[4] = adj[7] = null

        return adj
    }

    // Default is medium
    let difficulty = 1

    let [ROWS, COLS, MAX_MINE, SMALL] = difficulties[1]


    let ms = {
        mines: [],
        board: [],
        flags: MAX_MINE,
        visible: 0,
        time: 0,
        over: false
    }

    let display = []
    let flags = get("flags")
    let time = get("time")
    let timer = undefined

    function generate(n) {
        // Generate board
        // generate(-1) generates the blank board
        // generate(n) generates a board, where n represents square of the first click
        n = n || 0

        ms.mines = []
        ms.board = new Array(COLS * ROWS).fill(0)

        if (n >= 0 && n <= COLS * ROWS) {
            let adj = get_neighbours(n)

            for (let mine = 0; mine < MAX_MINE; mine++) {
                let spot = random(COLS * ROWS - 1)

                // Do not place a mine in the 8 adjacent squares,
                // the clicked spot, and the spots already mines.
                while (adj.includes(spot) || spot == n || ms.mines.includes(spot))
                    spot = random(COLS * ROWS - 1)

                ms.board[spot] = -1
                ms.mines.push(spot)
            }
        }

        setup()
    }

    function game_over() {
        clearInterval(timer)
        ms.over = true

        for (let mine of ms.mines) {
            display[mine].style.color = "#B44557"
            display[mine].innerHTML = "X"
        }
    }

    function game_win() {
        clearInterval(timer)
        ms.over = true

        let popup = document.createElement("div")
        let content = document.createElement("div")

        popup.id = "ms-winner"
        content.innerHTML = "you are win."

        popup.appendChild(content)

        board.appendChild(popup)
    }

    function flag(i) {
        return e => {
            e.preventDefault()

            if (ms.over || ms.board[i] == -2)
                return

            let html = display[i].innerHTML

            if (html.charCodeAt(0) != 9873) {
                if (ms.flags <= 0)
                    return

                html = "&#x2691;"
                display[i].style.color = "#B44557"
                ms.flags--
            } else {
                html = "&nbsp;"
                ms.flags++
                display[i].style.color = null
            }

            display[i].innerHTML = html
            flags.innerHTML = ms.flags
        }
    }

    function reveal(i) {
        if (i == null)
            return

        if (!ms.mines.length)
            generate(i)

        let val = ms.board[i]
        let element = board.children[Math.floor(i / COLS)].children[i % COLS]

        if (val == -2 || element.innerHTML.charCodeAt(0) == 9873)
            return

        if (ms.board[i] == -1)
            return game_over()

        if (val >= 0) {
            element.innerHTML = val == 0 ? "&nbsp;" : val
            element.style.color = colors[val]
            element.classList.add("revealed")
            ms.visible--
            ms.board[i] = -2
        }

        if (ms.visible == MAX_MINE)
            return game_win()

        if (!val)
            for (let adj of get_neighbours(i))
                reveal(adj)
    }

    function press(i) {
        return () => {
            if (!ms.over) {
                if (display[i].innerHTML != "&#x2691;")
                    reveal(i)

                if (timer == undefined)
                    timer = setInterval(_ => time.innerHTML = ++ms.time, 1000)
            }
        }
    }

    function setup() {
        if (ms.mines == undefined)
            return

        let win = get("winner")

        if (win)
            win.remove()

        get("stats").style.visibility = null
        display = []

        generated = true

        clearInterval(timer)
        timer = undefined

        ms.flags = MAX_MINE
        ms.over = false
        ms.visible = COLS * ROWS
        ms.time = 0

        flags.innerHTML = ms.flags
        time.innerHTML = 0

        // The children does not update when innerHTML is emptied
        // therefore, remake the element to get proper resizing
        // from the client bounding rectangle
        let parent = board.parentElement

        board.remove()
        board = document.createElement("div")
        board.id = "ms-board"

        parent.appendChild(board)

        let row = undefined
        for (let i = 0; i < COLS * ROWS; i++) {
            if (i % COLS == 0) {
                row = document.createElement("div")
                board.appendChild(row)
            }

            let cell = document.createElement("button")

            cell.innerHTML = "&nbsp;"
            cell.style.color = null

            if (SMALL)
                cell.classList.add("small")

            if (ms.board[i] != -1) {
                let adjacent = 0

                for (let j of get_neighbours(i))
                    if (j == null)
                        continue
                    else
                        adjacent += ms.board[j] == -1

                ms.board[i] = adjacent
            }

            cell.addEventListener("contextmenu", flag(i))
            cell.onclick = cell.ontouchstart = press(i)

            row.appendChild(cell)
            display.push(cell)
        }

        board.style.minWidth = board.children[0].getBoundingClientRect().width + "px"
    }

    return {
        generate: generate,
        difficulty: (e) => {
            try {
                let i = parseInt(e.value) - 1

                ROWS = difficulties[i][0]
                COLS = difficulties[i][1]
                MAX_MINE = difficulties[i][2]
                SMALL = difficulties[i][3]

                difficulty = i

                generate(-1)
            } catch (except) { }
        }
    }
})()

let game = ms.generate(-1)
