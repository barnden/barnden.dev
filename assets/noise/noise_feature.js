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

curl_feature_animation()

document.getElementById("curl-restart").addEventListener("click", curl_feature_animation)

// Hide the large featured display if JavaScript is not enabled.
document.getElementById("feature").classList.remove("hidden");
