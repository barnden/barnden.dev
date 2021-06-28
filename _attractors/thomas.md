---
title: "Thomas' Cyclically Symmetric Attractor"
layout: attractor
math: true
excerpt: Thomas' cyclically symmetric attractor is a strange attractor with a simple set of rules.
---

---

{{ page.excerpt }}[^1] [^2]

---

$$
\begin{align*}
\dot{x} &= \sin(y) - bx\\
\dot{y} &= \sin(z) - by\\
\dot{z} &= \sin(x) - bz
\end{align*}
$$

<div class="center" markdown="1">
In the above demo the constant $$b = 0.1998$$.
</div>

[^1]: [Deterministic chaos seen in terms of feedback circuits: Analysis, synthesis, 'labyrinth chaos'. Ren&eacute; Thomas, 1999.](https://doi.org/10.1142/S02181274990013830)
[^2]: [Thomas' cyclically symmetric attractor on Wikipedia](https://en.wikipedia.org/wiki/Thomas%27_cyclically_symmetric_attractor)

<script type="text/x-fragment-shader" id="update-vs">
#version 300 es
precision highp float;

uniform float u_Consts[1];
uniform float u_Speed;
uniform sampler2D u_RgbNoise;

in vec3 i_Position;

out vec3 v_Position;

vec3 get_velocity()
{
    return vec3(
        sin(i_Position.y) - u_Consts[0] * i_Position.x,
        sin(i_Position.z) - u_Consts[0] * i_Position.y,
        sin(i_Position.x) - u_Consts[0] * i_Position.z
    );
}

void main()
{
    vec3 pos = i_Position + get_velocity() * u_Speed;

    ivec2 uv = ivec2(int(i_Position[0]) % 512, int(i_Position[1]) % 512);
    vec3 noise = (texelFetch(u_RgbNoise, uv, 0).rgb / 255.);

    pos = mix(pos, noise, float(length(pos) > 25.));
    pos += noise * 2.;

    v_Position = pos;
}
</script>
