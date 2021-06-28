---
title: "Dadras Attractor"
layout: attractor
math: true
excerpt: The Dadras attractor was introduced in 2009, it is notable for the ability to generate two, three, or four-scroll (or "winged") attractors by varying one parameter.
---

---

{{ page.excerpt }}[^1]

---

$$
\begin{align*}
\dot{x} &= y - ax + byz\\
\dot{y} &= c + z(1 - x)\\
\dot{z} &= dxy - ez
\end{align*}
$$

<div class="center" markdown="1">
In the above demo the constants:

$$
a = 3,\ b = 2.7,\ c = 1.7,\ d = 2,\ e = 9
$$
</div>

[^1]: [A novel three-dimensional autonomous chaotic system generating two, three and four-scroll attractors. Dadras & Momeni, 2009.](https://doi.org/10.1016/j.physleta.2009.07.088)

<script type="text/x-fragment-shader" id="update-vs">
#version 300 es
precision highp float;

uniform float u_Consts[6];
uniform float u_Speed;
uniform sampler2D u_RgbNoise;

in vec3 i_Position;

out vec3 v_Position;

vec3 get_velocity()
{
    return vec3(
        i_Position.y - u_Consts[0] * i_Position.x + u_Consts[1] * i_Position.y * i_Position.z,
        u_Consts[2] * i_Position.y + (1. - i_Position.x) * i_Position.z,
        u_Consts[3] * i_Position.x * i_Position.y - u_Consts[4] * i_Position.z
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
