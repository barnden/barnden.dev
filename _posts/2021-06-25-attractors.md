---
layout: post
title:  "Strange Attractors"
date:   2021-06-25 19:00:00
categories: math webgl2 glsl
math: true
---
[Strange attractors](https://en.wikipedia.org/wiki/Attractor#Strange_attractor) are very cool. They describe a state that a dynamical system tends towards over time for many initial conditions. Of all the attractors I've seen, the Halvorsen attractor is my favorite attractor.

## Halvorsen Attractor

<div class="flex-center">
    <canvas class="border pointer" id="display" width="800" height="800"></canvas>
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

uniform float u_Alpha;
uniform float u_Speed;
uniform sampler2D u_RgbNoise;

in vec3 i_Position;

out vec3 v_Position;
```

The uniform inputs:
- `u_Alpha` is the $$\alpha$$ parameter inside the Halvorsen equations.
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

in vec3 i_Position;
```

The uniform inputs:
- `u_Angles` is a vector containing [Tait-Bryan angles](https://en.wikipedia.org/wiki/Euler_angles#Tait%E2%80%93Bryan_angles) (describes the object's rotation).
- `u_Camera` is a vector containing the camera's coordinates in Cartesian coordinates.
- `u_Scale` is a scalar describing the $$w$$ coordinate for the particle's [Homogeneous coordinates](https://en.wikipedia.org/wiki/Homogeneous_coordinates).

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
        cy * cz               , cy * sz               , -sy    ,
        sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy,
        cx * sy * cz + sx * sz, cx * sy * sz - sx * cz, cx * cy
    );

    return projection;
}
```

The `get_persective()` function computes the [Perspective projection matrix](https://en.wikipedia.org/wiki/3D_projection#Perspective_projection) using the Tait-Bryan angles. The projection matrix allows us to transform the relative position from Cartesian space to clip space.

In the `main()` function below, we first compute the projection matrix and the relative position (particle position minus camera position). Then, we compute `gl_Position` by setting the x, y, and z the transformed coordinates, and the w coordinate to `u_Scale`.

```glsl
void main() {
    mat3 projection = get_perspective();
    vec3 rel_position = i_Position - u_Camera;

    gl_Position = vec4(projection * rel_position, u_Scale);
    gl_PointSize = 1.;
}
```

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

The frag shader is very simple, all it does is compute a linear gradient based on the z coordinate of the particle.

<script type="text/x-fragment-shader" id="update-vs" markdown="0">
#version 300 es
precision highp float;

uniform float u_Alpha;
uniform float u_Speed;
uniform sampler2D u_RgbNoise;

in vec3 i_Position;

out vec3 v_Position;

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

void main()
{
    ivec2 uv = ivec2(int(i_Position[0]) % 512, int(i_Position[1]) % 512);
    vec3 noise = texelFetch(u_RgbNoise, uv, 0).rgb / 255.;

    vec3 pos = i_Position + get_velocity() * u_Speed;

    pos = mix(pos, noise, float(length(pos) > 25.));
    pos += noise;

    v_Position = pos;
}
</script>
<script type="text/x-fragment-shader" id="update-fs" markdown="0">
#version 300 es
precision highp float;

void main()
{
    discard;
}
</script>
<script type="text/x-fragment-shader" id="render-vs" markdown="0">
#version 300 es
precision highp float;

uniform vec3 u_Angles;
uniform vec3 u_Camera;
uniform float u_Scale;

in vec3 i_Position;

mat3 get_perspective(vec3 angles)
{
    // Get the Perspective Projection
    float cx = cos(angles.x),
          cy = cos(angles.y),
          cz = cos(angles.z),
          sx = sin(angles.x),
          sy = sin(angles.y),
          sz = sin(angles.z);

    // clang-format off
    mat3 projection = mat3(
        cy * cz               , cy * sz               , -sy    ,
        sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy,
        cx * sy * cz + sx * sz, cx * sy * sz - sx * cz, cx * cy
    );
    // clang-format on

    return projection;
}

void main() {
    mat3 projection = get_perspective(u_Angles);
    vec3 rel_position = i_Position - u_Camera;

    gl_Position = vec4(projection * rel_position, u_Scale);
    gl_PointSize = 1.;
}
</script>
<script type="text/x-fragment-shader" id="render-fs" markdown="0">
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
</script>
<script src="https://static.barnden.dev/particles/js/main.js">