---
title: "Sprott Attractor"
layout: attractor
math: true
excerpt: The Sprott attractor was found via numerical search for chaotic systems in 2014.
---

---

{{ page.excerpt }}[^1]

---

$$
\begin{align*}
\dot{x} &= y + x(ay + z)\\
\dot{y} &= 1 - bx^2 + yz\\
\dot{z} &= x - x^2 - y^2
\end{align*}
$$

<div class="center" markdown="1">
In the above demo the constant $$a = 2.07,\ b = 1.79$$.
</div>

[^1]: [A dynamical system with a strange attractor and invariant tori. J.C. Sprott, 2014.](http://sprott.physics.wisc.edu/pubs/paper423.pdf)

<script type="text/x-fragment-shader" id="update-vs">
#version 300 es
precision highp float;

uniform float u_Consts[2];
uniform float u_Speed;
uniform sampler2D u_RgbNoise;

in vec3 i_Position;

out vec3 v_Position;

vec3 get_velocity()
{
    float x2 = pow(i_Position.x, 2.);

    return vec3(
        i_Position.y + i_Position.x * (u_Consts[0] * i_Position.y + i_Position.z),
        1. - u_Consts[1] * x2 + i_Position.y * i_Position.z,
        i_Position.x - x2 - pow(i_Position.y, 2.)
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
