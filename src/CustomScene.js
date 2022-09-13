// import { BufferGeometry, Group, LineBasicMaterial, LineSegments, Object3D, Vector3 } from 'three'

export default class CustomScene {
  constructor({ artifact, preload, W }) {
    this.W = W
    this.THREE = preload.THREE

    const defaultLayerConfig = [{ mat: { color: 0xff0000 }, pos: [0, 0, 0] }]

    const { file = artifact.slug } = artifact.latk

    const { fps = 12, layers = defaultLayerConfig, reverse = false } = artifact.latk

    this.file = file
    const oneSecond = 1000 //ms
    this.frameMsInterval = oneSecond / fps

    this.layers = layers

    this.reverse = reverse

    // builtins
    this.longestLayer = -1
    this.currentFrame = 0

    this.light
  }

  beforeLoadModel({ engine, preload }) {
    //const { BufferGeometry, Group, Object3D } = this.THREE
    const { BufferGeometry, Group, Object3D, AmbientLight } = this.THREE
    this.model = new Object3D()
    this.model.position.set(0, 0, 0)

    if (preload.assets.gltf) {
      preload.assets.gltf.scene.position.set(0, 2, 2)
      this.model.add(preload.assets.gltf.scene)
      
      this.light = new AmbientLight(0x808080); 
      this.light.color.setRGB(0.25, 1.0, 1.0);
      this.model.add(this.light);
    }

    this.renderer = engine.renderer
    this.camera = engine.camera
    this.scene = engine.scene
    this.buffer = new BufferGeometry()
    
    this.lineGroup = new Group()
    this.lineGroup.scale.set(1, 1, 2)
    this.model.add(this.lineGroup)

    this.layers.forEach(layer => {
      const line = this.createLayer(layer)
      this.lineGroup.add(line)
    })
  }

  createLayer(layer) {
    const { LineBasicMaterial, LineSegments, Vector3 } = this.THREE

    const { mat, pos } = layer

    const lbm = new LineBasicMaterial(mat)
    const line = new LineSegments(this.buffer, lbm)
    line.frustumCulled = false

    if (pos) {
      line.position.add(new Vector3(...pos))
    }

    return line
  }

  async preload() {
    let { file } = this

    if (!file.endsWith('.js')) {
      file += '.js'
    }

    if (!file.startsWith('/')) {
      file = `${this.W.STATIC_URL}/latk/${file}`
    }

    const { latk } = await import(file)

    latk.forEach(parent => {
      parent.layers.forEach(layer => {
        if (layer.frames.length > this.longestLayer) {
          this.longestLayer = layer.frames.length
        }

        layer.frames.forEach(frame => {
          frame.strokes.forEach(stroke => {
            const points = stroke.points.map(p => {
              return this.point2Vec(p)
            })

            stroke.points = points
          })
        })
      })
    })

    this.latk = latk
  }

  point2Vec(co) {
    const { Vector3 } = this.THREE

    co = Array.isArray(co) ? co : co.co

    if (this.reverse) {
      co = co.reverse()
    }

    return new Vector3(...co)
  }

  tick({ timestamp }) {
    this.light.intensity = Math.random() + 1.0;

    const { latk } = this

    if (!latk || !latk.length) {
      return
    }

    if (!this.lastTick || this.lastTick + this.frameMsInterval <= timestamp) {
      const points = []

      latk.forEach(parent => {
        const { layers } = parent

        layers.forEach(layer => {
          // make sure frames are defined, even if empty
          const { frames = {} } = layer
          const { strokes = [] } = frames[this.currentFrame]

          strokes.forEach(stroke => {
            const newPoints = this.drawStroke(stroke)
            points.push(...newPoints)
          })
        })
      })

      this.buffer.setFromPoints(points)

      this.currentFrame += 1
      this.lastTick = timestamp

      this.lineGroup.traverse(line => {
        line.geometry = this.buffer
      })

      const maxFrame = this.longestLayer - 1
      if (this.currentFrame > maxFrame) {
        this.currentFrame = 0
      }
    }
  }

  drawStroke(stroke) {
    const points = []

    for (let i = 0; i < stroke.points.length - 1; i++) {
      points.push(stroke.points[i])
      points.push(stroke.points[i + 1])
    }

    return points
  }
}
