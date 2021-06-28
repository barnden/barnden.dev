---
title: "Lorenz Attractor"
layout: attractor
math: true
excerpt: The Lorenz attractor was found in 1963, it is a set of chaotic solutions for a system of ordinary differential equations.
---

---

{{ page.excerpt }}[^1]

---

$$
\begin{align*}
\dot{x} &= \sigma(y - x)\\
\dot{y} &= x(\rho - z) - y\\
\dot{z} &= xy - \beta z
\end{align*}
$$

<div class="center" markdown="1">
In the above demo the constants:

$$\sigma = 10,\ \rho = 28,\ \beta = \frac{8}{3}$$
</div>

[^1]: [Lorenz system on Wikipedia](https://en.wikipedia.org/wiki/Lorenz_system)

<script type="text/x-fragment-shader" id="update-vs">
#version 300 es
precision highp float;

uniform float u_Consts[3];
uniform float u_Speed;
uniform sampler2D u_RgbNoise;

in vec3 i_Position;

out vec3 v_Position;

vec3 get_velocity()
{
    return vec3(
        u_Consts[0] * (i_Position[1] - i_Position[0]),
        u_Consts[1] * i_Position[0] - i_Position[0] * i_Position[2] - i_Position[1],
        i_Position[0] * i_Position[1] - u_Consts[2] * i_Position[2]
    );
}

void main()
{
    v_Position = i_Position + get_velocity() * u_Speed;
}
</script>
