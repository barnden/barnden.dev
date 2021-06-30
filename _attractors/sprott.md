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

<script type="text/x-fragment-shader" id="update-vs">#version 300 es
precision highp float;uniform float u_Consts[2],u_Speed;uniform sampler2D u_RgbNoise;in vec3 i_Position;out vec3 v_Position;void main(){float a=i_Position.x,b=i_Position.y,c=i_Position.z,d=pow(a,2.),e[2]=u_Consts;vec3 p=i_Position+vec3(b+a*(e[0]*b+c),1.-e[1]*d+b*c,a-d-pow(b,2.))*u_Speed,n=texelFetch(u_RgbNoise,ivec2(int(a)%512,int(b)%512),0).rgb/255.;v_Position=mix(p,n,float(length(p)>25.))+n*2.;}</script>
