export default {
  name: 'Artifact',
  slug: 'artifact',

  version: 1,

  /*
   * type
   *
   * which scene type to load.
   * -1 loads src/CustomScene.js
   */
  type: -1,

  /*
   * sky
   *
   * will load src/skybox.jpg as skybox image.
   * the leading slash is important
   */
  sky: '/skybox',

  glb: false,
 
  file: 'artifact',

  /*
  latk: {
    // starting the file with a / loads it from the sandbox src dir.
    file: '/latk.js',

    layers: [
      { mat: { color: 0xeeff55 }, pos: [-0.01, 0, 0] },
      { mat: { color: 0x33ff33 }, pos: [0, 0, -0.1] },
      { mat: { color: 0x00aaff }, pos: [0, 0.05, 0.1] },
    ],
  },
  */

  /*
  cam: {
    y: 1.7,
  },

  lookat: {
    y: 1.7,
  },

  orbit: {
    max: 15,
  },
  */

}
