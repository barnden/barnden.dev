importScripts("https://static.barnden.dev/barn-noise/noise.js")

onmessage = e => {
    if (e.data)
        noise(res => postMessage(res), ...e.data)
}
