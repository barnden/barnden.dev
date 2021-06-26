function curl_feature_animation() {
    particle({
        canvas_name: "curl-demo",
        func: "curl",
        scale: 8,
        particle_count: 1024,
        opt: [[8e-4, 8e-4]],
        time: 10000,
        queue_hook: q => q.map((e, i) => [i, ...e.pos]),
        noise_hook: data => [data.splice(0, 1)[0], data],
        move_hook: vec => vec.map(e => e / 10)
    })()
}

window.addEventListener("load", _ => {
    const restart = document.getElementById("curl-restart")

    restart.classList.remove("hidden")
    restart.addEventListener("click", _ => {
        restart.innerHTML = "Restart Animation"
        document.getElementById("noise-feature-img").classList.add("hidden")
        document.getElementById("curl-feature").classList.remove("hidden")
        curl_feature_animation()
    })
})
