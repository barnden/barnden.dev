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

<script type="text/x-fragment-shader" id="update-vs">#version 300 es
precision highp float;uniform float u_Consts[1],u_Speed;uniform sampler2D u_RgbNoise;in vec3 i_Position;out vec3 v_Position;void main(){float a=i_Position.x,b=i_Position.y,c=i_Position.z,d=u_Consts[0];vec3 pos=i_Position+vec3(sin(b)-d*a,sin(c)-d*b,sin(a)-d*c)*u_Speed,n=(texelFetch(u_RgbNoise,ivec2(int(a)%512,int(b)%512),0).rgb/255.);v_Position=mix(pos,n,float(length(pos)>25.))+n*2.;}</script>
