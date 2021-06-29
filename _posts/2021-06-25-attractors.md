---
layout: post
title:  "Strange Attractors"
date:   2021-06-25 19:00:00
categories: projects featured art math webgl2 glsl
math: true
---
[Strange attractors](https://en.wikipedia.org/wiki/Attractor#Strange_attractor) describe a state that a dynamical system tends towards over time for many initial conditions. Of all the attractors I've seen, the Halvorsen attractor is my favorite attractor.

## Halvorsen Attractor
<div class="flex-center">
    <canvas class="border pointer demo" id="attractor-demo" width="800" height="800"></canvas>
    <figcaption>Click and drag on the attractor to rotate it.</figcaption>
</div>

---

The motion of a particle in the Halvorsen attractor is given by the following equations:

$$
\begin{align*}
\dot{x} &= -\alpha x-4y-4z-y^2\\
\dot{y} &= -\alpha y-4z-4x-z^2\\
\dot{z} &= -\alpha z-4x-4y-x^2
\end{align*}
$$

Where $$\alpha$$ is some constant, for the demo above it is equal to 1.89.

### Other Attractors
- [Thomas' cyclically symmetric attractor]({{ "/attractors/thomas" | relative_url }})
- [Dadras' attractor]({{ "/attractors/dadras" | relative_url }})
- [Sprott attractor]({{ "/attractors/sprott" | relative_url }})
- [Lorenz attractor]({{ "/attractors/lorenz" | relative_url }})

The full source for the above demos is [available on GitHub](https://github.com/barnden/particles).

---

## Shaders

Using WebGL2, we can take advantage of the GPU to process many points in parallel using shader code (GLSL ES). We can use shaders for both computation (GPGPU) and for rendering objects.

In the Halvorsen attractor demo above, we create two WebGL programs: one to compute the particle positions, and one to compute the particle's color.

---

### Positioning

Below is the vertex shader for computing the particle's position.

```glsl
#version 300 es
precision highp float;

uniform float u_Consts[1];
uniform float u_Speed;
uniform sampler2D u_RgbNoise;

in vec3 i_Position;

out vec3 v_Position;
```

The uniform inputs:
- `u_Consts` is an array containing the $$\alpha$$ parameter inside the Halvorsen equations.
- `u_Speed` is a scalar that is used for scaling the velocity vector.
- `u_RgbNoise` is an RGB texture with random byte values for each color channel.


Then, the `get_velocity()` function is a straight forward implementation of the Halvorsen equations.

```glsl
vec3 get_velocity()
{
    vec3 velo = vec3(0.);

    velo.x = -u_Alpha * i_Position.x
             - 4. * i_Position.y
             - 4. * i_Position.z
             - i_Position.y * i_Position.y;

    velo.y = -u_Alpha * i_Position.y
             - 4. * i_Position.z
             - 4. * i_Position.x
             - i_Position.z * i_Position.z;

    velo.z = -u_Alpha * i_Position.z
             - 4. * i_Position.x
             - 4. * i_Position.y
             - i_Position.x * i_Position.x;

    return velo;
}
```

Inside the `main()` function, we compute the particle's new position using the following steps:
1. Compute the `pos` vector by adding the particle's velocity times `u_Speed` to its current position.
2. Sample the `u_RgbNoise` texture to get a random `vec3`, and add it to the `pos` vector.
    - This prevents the attractor from converging into lines too quickly.
3. Finally, we check to see if the particle's position exceeds a length of 25 units, if it does, teleport it back to a random position as sampled from `u_RgbNoise`.

We generated the `u_RgbNoise` texture on the CPU to take advantage of JavaScript's `Math.random()` function in place of [implementing a PRNG on the GPU](https://umbcgaim.wordpress.com/2010/07/01/gpu-random-numbers/). To sample from `u_RgbNoise` we use the particle's x and y coordinates modulo 512 to pick a pixel, and use the RGB values as a `ivec3`. As these are byte values, we can divide this `ivec3` by 255 to get a `vec3` of floats in the range [0, 1].

```glsl
void main()
{
    vec3 pos = i_Position + get_velocity() * u_Speed;

    ivec2 uv = ivec2(int(i_Position[0]) % 512, int(i_Position[1]) % 512);
    vec3 noise = texelFetch(u_RgbNoise, uv, 0).rgb / 255.;

    pos = mix(pos, noise, float(length(pos) > 25.));
    pos += noise;

    v_Position = pos;
}
```

Because we do not want to draw anything to the screen while computing the particle positions, we can simply `discard` all the pixels in the frag shader:

```glsl
#version 300 es
precision highp float;

void main()
{
    discard;
}
```

---

### Rendering - Vertex Shader

```glsl
#version 300 es
precision highp float;

uniform vec3 u_Angles;
uniform vec3 u_Camera;
uniform float u_Scale;
uniform float u_Ortho[6];

in vec3 i_Position;
```

The uniform inputs:
- `u_Angles` is a vector containing [Tait-Bryan angles](https://en.wikipedia.org/wiki/Euler_angles#Tait%E2%80%93Bryan_angles) (describes the object's rotation).
- `u_Camera` is a vector containing the camera's coordinates in Cartesian coordinates.
- `u_Scale` is a scalar describing the $$w$$ coordinate for the particle's [Homogeneous coordinates](https://en.wikipedia.org/wiki/Homogeneous_coordinates).
- `u_Ortho` is a 6-tuple (array) containing the clipping bounds for [Orthographic projection](https://en.wikipedia.org/wiki/Orthographic_projection).

```glsl
mat3 get_perspective()
{
    float cx = cos(u_Angles.x),
          cy = cos(u_Angles.y),
          cz = cos(u_Angles.z),
          sx = sin(u_Angles.x),
          sy = sin(u_Angles.y),
          sz = sin(u_Angles.z);

    mat3 projection = mat3(
        cy * cz, cy * sz, -sy,
        sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy,
        cx * sy * cz + sx * sz, cx * sy * sz - sx * cz, cx * cy
    );

    return projection;
}
```

The `get_perspective()` function computes the following [projection matrix](https://en.wikipedia.org/wiki/3D_projection#Perspective_projection):

$$
\begin{bmatrix}
    1 & 0 & 0\\
    0 & \cos(\theta_x) & \sin(\theta_x)\\
    0 & -\sin(\theta_x) & \cos(\theta_x)
\end{bmatrix}
\begin{bmatrix}
\cos(\theta_y) & 0 & -\sin(\theta_y)\\
0 & 1 & 0\\
\sin(\theta_y) & 0 & \cos(\theta_y)
\end{bmatrix}
\begin{bmatrix}
\cos(\theta_z) & \sin(\theta_z) & 0\\
-\sin(\theta_z) & \cos(\theta_z) & 0\\
0 & 0 & 1
\end{bmatrix}
\begin{bmatrix}
x\\y\\z
\end{bmatrix}
$$

The $$\vec{\theta} = \langle\theta_x, \theta_y, \theta_z\rangle$$ are Tait-Bryan angles describing the object's rotation in space. This matrix allows us to transform a particle's 3D coordinates to get the orientation that we want.

```glsl
mat4 get_orthographic()
{
    // Ortho 6-tuple: (left, right, bottom, top, near, far)
    return mat4(
        1. / (u_Ortho[1] - u_Ortho[0]), 0., 0., -(u_Ortho[1] + u_Ortho[0]) / (u_Ortho[1] - u_Ortho[0]),
        0., 2. / (u_Ortho[3] - u_Ortho[2]), 0., -(u_Ortho[3] + u_Ortho[2]) / (u_Ortho[3] - u_Ortho[2]),
        0., 0., -2. / (u_Ortho[5] - u_Ortho[4]), -(u_Ortho[5] + u_Ortho[4]) / (u_Ortho[5] - u_Ortho[4]),
        0., 0., 0., 1.);
}
```

The `get_orthographic()` function computes the orthographic projection matrix, given `u_Ortho` 6-tuple of $$(L, R, B, T, N, F)$$

$$
\begin{bmatrix}
\frac{2}{R - L} & 0 & 0 & \frac{L + R}{2}\\
0 & \frac{T - B}{2} & 0 & \frac{T + B}{2}\\
0 & 0 & \frac{F - N}{-2} & -\frac{F + N}{2}\\
0 & 0 & 0 & 1
\end{bmatrix}
$$

The 6-tuple defines clipping planes, and the matrix allows us to transform the particle's coordinates into clip space.

```glsl
void main() {
    vec3 rel_position = i_Position - u_Camera;

    gl_Position = get_orthographic() * vec4(get_perspective() * rel_position, u_Scale);
    gl_PointSize = 1.;
}
```
In the `main()`, we first compute `rel_position` which is the particle's position vector minus the camera's position vector. Then, we apply the perspective projection matrix on `rel_position` and create Homogeneous coordinates by making `u_Scale` the $$w$$ component. Finally, we set `gl_Position` to the product of the orthographic projection matrix with the perspective.

### Rendering - Frag Shader

```glsl
#version 300 es
precision highp float;

out vec4 o_FragColor;

void main()
{
    vec3 color1 = vec3(1., 0., 0.);
    vec3 color2 = vec3(0., 0., 1.);

    vec3 color = mix(color1, color2, gl_FragCoord[2]);

    o_FragColor = vec4(color, 1.);
}
```

The frag shader is very simple, all it does is compute a linear gradient based on the $$z$$ coordinate of the particle.

{% include attractor-demo.html %}
{% include attractor.html %}
<script src="{{ "/assets/projects/shaders/demo.js" | relative_url }}"></script>
<script src="{{ "/assets/projects/shaders/attractor.js" | relative_url }}"></script>
