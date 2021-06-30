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

<script type="text/x-fragment-shader" id="update-vs">#version 300 es
precision highp float;uniform float u_Consts[3],u_Speed;uniform sampler2D u_RgbNoise;in vec3 i_Position;out vec3 v_Position;void main(){float a=i_Position.x,b=i_Position.y,c=i_Position.z,d[3]=u_Consts;v_Position = i_Position+vec3(d[0]*(b-a),d[1]*a-a*c-b,a*b-d[2]*c)*u_Speed;}</script>
