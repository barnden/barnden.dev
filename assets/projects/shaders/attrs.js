const attractors = {
    halvorsen: {
        consts: [1.89],
        speed: 1 / 80,
        angles: [0.57828, 5.8058, 0.],
        scale: 3.,
        camera: [0, -0.5, 0],
        ortho: [-4, 4, -4, 4, -4, 4]
    },
    lorenz: {
        consts: [10., 28., 8. / 3.],
        speed: 1 / 90,
        angles: [-1.66, -3.38, 0.],
        scale: 6.125,
        camera: [-1.25, 5, 25],
        ortho: [-5., 5., -5., 5., -5., 5.]
    },
    thomas: {
        consts: [0.1998],
        speed: 1 / 10,
        angles: [2.23, -2.97, 0.],
        scale: 1.,
        camera: [0, 0, 0],
        ortho: [-4.5, 4.5, -4.5, 4.5, -4.5, 4.5]
    },
    sprott: {
        consts: [2.07, 1.79],
        speed: 1 / 10,
        angles: [1.75, 1., 0.45],
        scale: 0.85,
        camera: [1, -0.5, -0.5],
        ortho: [-5., 5., -5., 5., -5., 5.]
    },
    dadras: {
        consts: [3, 2.7, 1.7, 2, 9],
        speed: 1 / 35,
        angles: [2.69, -3.06, 0.],
        scale: 1.75,
        camera: [1.5, -0.25, 0],
        ortho: [-8, 8, -8, 8, -8, 8]
    },
}

let attributes = attractors[typeof (attractor) !== "undefined" ? attractor : "halvorsen"]
