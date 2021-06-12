---
layout: post
title:  "Noise Functions"
date:   2021-01-26 21:42:08
modified_date:   2021-06-11 00:00:00
tags: projects
math: true
---
<link rel="stylesheet" href="{{ "/assets/noise/noise.css" | relative_url }}">

## Perlin Noise
My [implementation](https://github.com/barnden/barn-noise) is based on the Perlin code from ["Simplex noise demystified"](http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf) by Gustavson, and written using JavaScript.

However, I chose to use a randomly generated permuation table through the following snippet, rather than using Perlin's suggested table. The snippet generates a 256 element array with numbers 0 to 255, then shuffles them using the [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle).
{% highlight javascript %}
const p = [...new Array(256).keys()]
    .map((v, _, a, j = random(255)) => [a[j], a[j] = v][0])
const perm = new Array(512)
    .fill(0)
    .map((_, i) => p[i & 255])
{% endhighlight %}

The `random()` function was implemented in the following snippet using the `crypto` library provided in modern browsers (with fallback to `Math.random()`), which hopefully ensures a uniform random distribution.

{% highlight javascript %}
const MAX_UINT32 = new Uint32Array(1).fill(-1)[0]

function random_float() {
    return self.crypto ?
        self.crypto.getRandomValues(new Uint32Array(1))[0] / MAX_UINT32 :
        Math.random()
}

function random(max, min = 0, safe = false) {
    let val = (random_float() * (max - min + 1) + min)

    return safe ? Math.trunc(val) : ~~val
}
{% endhighlight %}

I exploit the two's complement representation of -1 to generate the maximum 32-bit unsigned integer. Then, `crypto.getRandomValues` creates a random unsigned 32-bit int that is divided by the maximum int from earlier to get a float from [0, 1]. Using the random float, I use it to generate a random integer between some range.

It is also possible to do random value mod N, if you want to create a random number [0, N - 1], however, this will result in the numbers not conforming to a uniform distribution as is desired.

My final implementation of the Perlin noise can take around 8 million calls per second, which is slower than the 10 million from [noise.js](https://github.com/josephg/noisejs).

---

## Fractional Brownian Motion (fBm)

Fractional Brownian motion is used to modulate Perlin noise, it works by superimposing the noise at a certain point with a number of octaves with increasing frequency and amplitude.

[The Book of Shaders](https://thebookofshaders.com/13/) has a good tutorial on how fBm can be used to modulate waves, and its implementation. Another good resource is this [article](https://www.iquilezles.org/www/articles/fbm/fbm.htm) by Inigo Quilez.

---

## Curl Noise
Notes from ["Curl-Noise for Procedural Fluid Flow"](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf) by Bridson et al.

A given potential field $$\Psi$$ has a curl in $$\mathbb{R}^3$$ defined by

$$
    \vec{v}(x, y, z) = \nabla \times \Psi =
    \left(
        \frac{\partial\Psi_z}{\partial y} - \frac{\partial\Psi_y}{\partial z},
        \frac{\partial\Psi_x}{\partial z} - \frac{\partial\Psi_z}{\partial x},
        \frac{\partial\Psi_y}{\partial x} - \frac{\partial\Psi_x}{\partial y}
    \right).
$$

The curl definition can be extended into $$\mathbb{R}^2$$ where $$\Psi$$ is a scalar field, which then yields

$$
    \vec{v}(x, y) = \left(
        \frac{\partial\Psi}{\partial y},
        -\frac{\partial\Psi}{\partial x}
    \right).
$$

If $$\Psi$$ is smooth, then the curl of $$\Psi$$ is divergence free, i.e. $$\nabla \cdot \nabla \times \equiv 0$$, as a result, the field has no sources or sinks and is incompressible.
### Considerations
1. The partial derivatives are calculated using finite diference approximations, Bridson recommends a step value of $$10^{-4}$$ times the domain.
2. Perlin noise, $$N(x, y)$$, can be used to construct the potential field, in $$\mathbb{R}^2, \Psi = N$$.
3. Adding octaves of different scales can produce fields similar to physical turbulance.
  - See: Kolmogorov turbulance spectrum on how to reduce the speed of small vortices.
4. Ideally, the field should vary with time, possibly by using FlowNoise.

### Implementation
The finite difference calculations in $$\mathbb{R}^2$$ were made using the [approximations](https://en.wikipedia.org/wiki/Finite_difference#Multivariate_finite_differences) listed on Wikipedia.

$$
    f_x(x, y) \approx \frac{f(x + h, y) - f(x - h, y)}{2h},
$$

$$
    f_y(x, y) \approx \frac{f(x, y + k) - f(x, y - k)}{2k},
$$

where the constants $$h$$ and $$k$$ were $$10^{-4}$$ times the domain as suggested.

Instead of taking the curl of the regular Perlin noise, I modulated the field using Fractional Brownian motion using 3 octaves, a lacunarity of 2, and gain of 0.5.

To evolve the field over time, I took the delta between the current and start time of animation and put it through a sine function multiplied by a random constant. This number was then put into a 3D Perlin noise function as the third (z) component, and the x/y components were the usual screen coordiates transformed using a function that linearly generates a number within some specified range (in the [Curl Noise demo](#curl-noise-1) from 0 to 8).

---

<div class="noise-container">
    <div class="step-1">
        <canvas id="demo-perlin" class="noise-demo" width="450" height="450"></canvas>
        <figcaption>
        Step 1: Generate Perlin noise
        </figcaption>
    </div>
    <div class="step-2">
        <canvas id="demo-fbm" class="noise-demo" width="450" height="450"></canvas>
        <figcaption>
        Step 2: Modulate using Fractional Brownian motion
        </figcaption>
    </div>
    <div class="step-3">
        <canvas id="demo-curl" class="noise-demo" width="450" height="450"></canvas>
        <figcaption>
        Step 3: Calculate 2D curl using finite differences.<br>
        To visualize curl field, I sampled a grid of points and computed the angle of flow at that point, then drew a line in that direction, with the color corresponding to the HSL color at the angle it is pointing.
        </figcaption>
    </div>
    <button id="demo-restart">Generate New Renders</button>
</div>

---

## Demonstrations

In the end, I added support for web workers in order to parallelize the computation for noise generation, however, using WebGL shaders would be a much better option for parallelization in the browser.

The cost incurred for invoking multiple threads is significant, and would actually be slower than processing the noise in the main thread for the particle demos on this page.

The demonstrations below are rendered in real time, using particles originating in random positions on the xy-plane with velocities determined by the corresponding noise field.

### Perlin Noise
<div class="noise-container">
    <canvas id="perlin-demo" class="noise-demo" width="450" height="450"></canvas>
    <figcaption>
        Perlin yields a scalar instead of a vector, to get around this, I generate a 2D vector by combining two Perlin calculations, one at the (x, y) position of the particle, and another at some constant offset from the particle.
    </figcaption>

    <button id="perlin-restart">Restart Perlin Animation</button>
</div>

### Curl Noise
<div class="noise-container">
    <canvas id="curl-demo" class="noise-demo" width="450" height="450"></canvas>
    <figcaption>
    This curl noise demo superimposes the path of every particle, the brightness of a spot is directly correlated to how many times a particle has visited that spot.
    </figcaption>

    <button id="curl-restart">Restart Curl Animation</button>
</div>
<div class="noise-container">
    <canvas id="curl-flow-demo" class="noise-demo" width="450" height="450"></canvas>
    <figcaption>
    The above demo shows how particles travel within the velocity field generated by curl noise. The color of the particle's path is dependent on the HSL color at the angle it is travelling.
    </figcaption>
    <button id="curl-flow-restart">Restart Curl Flow Animation</button>
</div>

<script src="https://static.barnden.dev/barn-noise/noise.js"></script>
<script src="https://static.barnden.dev/barn-noise/particle.js"></script>
<script src="{{ "/assets/noise/noise_demo.js" | relative_url }}"></script>
