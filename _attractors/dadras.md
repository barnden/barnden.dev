---
title: "Dadras Attractor"
layout: attractor
math: true
excerpt: The Dadras attractor was introduced in 2009,it is notable for the ability to generate two,three,or four-scroll (or "winged") attractors by varying one parameter.
---

---

{{ page.excerpt }}[^1]

---

$$
\begin{align*}
\dot{x} &= y-ax+byz\\
\dot{y} &= c+z(1-x)\\
\dot{z} &= dxy-ez
\end{align*}
$$

<div class="center" markdown="1">
In the above demo the constants:

$$
a=3,\ b=2.7,\ c=1.7,\ d=2,\ e=9
$$
</div>

[^1]: [A novel three-dimensional autonomous chaotic system generating two,three and four-scroll attractors. Dadras & Momeni,2009.](https://doi.org/10.1016/j.physleta.2009.07.088)

<script type="text/x-fragment-shader" id="update-vs">#version 300 es
precision highp float;uniform float u_Consts[6],u_Speed;uniform sampler2D u_RgbNoise;in vec3 i_Position;out vec3 v_Position;void main(){float a=i_Position.x,b=i_Position.y,c=i_Position.z,d[6]=u_Consts;vec3 n=(texelFetch(u_RgbNoise,ivec2(int(a)%512,int(b)%512),0).rgb/255.),p=i_Position+vec3(b-d[0]*a+d[1]*b*c,d[2]*b+(1.-a)*c,d[3]*a*b-d[4]*c)*u_Speed;v_Position=mix(p,n,float(length(p)>25.))+n*2.;}</script>
