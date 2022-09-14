// import { BufferGeometry, Group, LineBasicMaterial, LineSegments, Object3D, Vector3 } from 'three'

const fragShader = `
varying vec2 vUv;
varying float visibility;
uniform sampler2D tex;

vec3 saturation(vec3 rgb, float adjustment) {
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}

void main() {
    vec2 uvRgb = vec2(vUv.x * 0.5, 0.5 + vUv.y * 0.5);
    vec4 col = texture2D(tex, uvRgb);

    if (visibility < 0.9) discard;

    gl_FragColor = vec4(saturation(col.xyz, 1.2), 0.25);
}`

const vertShader = `
varying vec2 vUv;
varying float visibility;
uniform sampler2D tex;	

// * * * * * * * * * * * * * * * * *
const float satThresh = 0.5; 		// orig 0.5 or 0.85
const float brightThresh = 0.5; 	// orig 0.5 or 0.85 or 0.9
const float epsilon = 1.0e-10; // orig 1.0e-10 or 0.0000000001 or orig 0.03
const float visibilityThreshold = 0.99;
// * * * * * * * * * * * * * * * * *

const float meshDensityVal = 2048.0;
const vec2 meshDensity = vec2(meshDensityVal, meshDensityVal);
const int numNeighbors = 4; // orig 8
const int numDudNeighborsThreshold = int(float(numNeighbors) * 0.75);

float rgbToHue(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    
    vec3 result = vec3(abs(q.z + (q.w - q.y) / (6.0 * d + epsilon)), d / (q.x + epsilon), q.x);
    
    return result.g > satThresh && result.b > brightThresh ? result.r : 0.0;
}
	
float depthForPoint(vec2 uv) {
	return rgbToHue(texture2D(tex, uv).rgb);
}

float calculateVisibility(float depth, vec2 uv) {
	float visibility = 1.0;
    vec2 textureStep = 1.0 / meshDensity;
    float neighborDepths[numNeighbors];
	neighborDepths[0] = depthForPoint(uv + vec2(0.0,  textureStep.y));
	neighborDepths[1] = depthForPoint(uv + vec2(textureStep.x, 0.0));
	neighborDepths[2] = depthForPoint(uv + vec2(0.0, -textureStep.y));
	neighborDepths[3] = depthForPoint(uv + vec2(-textureStep.x, 0.0));
	//neighborDepths[4] = depthForPoint(uv + vec2(-textureStep.x, -textureStep.y));
	//neighborDepths[5] = depthForPoint(uv + vec2(textureStep.x,  textureStep.y));
	//neighborDepths[6] = depthForPoint(uv + vec2(textureStep.x, -textureStep.y));
	//neighborDepths[7] = depthForPoint(uv + vec2(-textureStep.x,  textureStep.y));

    // Search neighbor verts in order to see if we are near an edge.
    // If so, clamp to the surface closest to us.
    int numDudNeighbors = 0;
    if (depth < epsilon || (1.0 - depth) < epsilon) {
        float nearestDepth = 1.0;
        for (int i=0; i<numNeighbors; i++) {
            float depthNeighbor = neighborDepths[i];
            if (depthNeighbor >= epsilon && (1.0 - depthNeighbor) > epsilon) {
                if (depthNeighbor < nearestDepth) {
                    nearestDepth = depthNeighbor;
                }
            } else {
                numDudNeighbors++;
            }
        }

        depth = nearestDepth;
        visibility = 0.8;

        // Blob filter
        if (numDudNeighbors > numDudNeighborsThreshold) {
            visibility = 0.0;
        }
    }

    // Internal edge filter
    float maxDisparity = 0.0;

    for (int i=0; i<numNeighbors; i++) {
        float depthNeighbor = neighborDepths[i];
        if (depthNeighbor >= epsilon && (1.0 - depthNeighbor) > epsilon) {
            maxDisparity = max(maxDisparity, abs(depth - depthNeighbor));
        }
    }

    visibility *= 1.0 - maxDisparity;

    return visibility;
}

void main() {
    gl_PointSize = 6.0;

    vUv = uv;
    vec2 uvX = vec2(0.5 + uv.x * 0.5, 0.5 + uv.y * 0.5);
    vec2 uvY = vec2(0.5 + uv.x * 0.5, uv.y * 0.5);
    vec2 uvZ = vec2(uv.x * 0.5, uv.y * 0.5);

    float posX = depthForPoint(uvX);
    float posY = depthForPoint(uvY);
    float posZ = depthForPoint(uvZ);	    

	float visX = calculateVisibility(posX, uvX);
	float visY = calculateVisibility(posY, uvY);
	float visZ = calculateVisibility(posZ, uvZ);
	visibility = visX < visibilityThreshold || visY < visibilityThreshold || visZ < visibilityThreshold ? 0.0 : 1.0;

    vec3 newPosition = vec3(posX, posY, posZ);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}`

export default class CustomScene {

  constructor({ artifact, preload, W }) {
    this.W = W
    this.THREE = preload.THREE

    //const defaultLayerConfig = [{ mat: { color: 0xff0000 }, pos: [0, 0, 0] }]

    //const { file = artifact.slug } = artifact.latk

    //const { fps = 12, layers = defaultLayerConfig, reverse = false } = artifact.latk

    //this.file = file
    //const oneSecond = 1000 //ms
    //this.frameMsInterval = oneSecond / fps

    //this.layers = layers

    //this.reverse = reverse

    // builtins
    //this.longestLayer = -1
    //this.currentFrame = 0

    //this.light
  }

  beforeLoadModel({ engine, preload }) {
    //const { BufferGeometry, Group, Object3D } = this.THREE
    
    const { BufferGeometry, Group, Object3D, AmbientLight, SphereBufferGeometry, VideoTexture, RGBAFormat, NearestFilter, LinearFilter, ShaderMaterial, Points } = this.THREE
    this.model = new Object3D()
    this.model.position.set(0, 0, 0)

    if (preload.assets.gltf) {
      preload.assets.gltf.scene.position.set(0, 2, 2)
      this.model.add(preload.assets.gltf.scene)
      
      //this.light = new AmbientLight(0x808080); 
      //this.light.color.setRGB(0.25, 1.0, 1.0);
      //this.model.add(this.light);
    }

    this.renderer = engine.renderer
    this.camera = engine.camera
    this.scene = engine.scene
    this.buffer = new BufferGeometry()
    
    /*
    this.lineGroup = new Group()
    this.lineGroup.scale.set(1, 1, 2)
    this.model.add(this.lineGroup)

    this.layers.forEach(layer => {
      const line = this.createLayer(layer)
      this.lineGroup.add(line)
    })
    */

    // ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

    const geometry = new SphereBufferGeometry(1, 256, 256)

    const video = document.createElement("video")
    video.crossOrigin = "anonymous"
    video.setAttribute('crossorigin', 'anonymous')
    video.setAttribute("webkit-playsinline", "webkit-playsinline")
    video.setAttribute('playsinline', 'playsinline')
    video.autoplay = true
    video.loop = true
    video.muted = true
    video.src = "output.mp4"
    video.play()

    const texture = new VideoTexture(video)
    texture.format = RGBAFormat
    texture.minFilter = NearestFilter
    texture.magFilter = LinearFilter
    texture.generateMipmaps = false

    const material = new ShaderMaterial({
      uniforms: {
        tex: {
          type: "t",
          value: texture
        }
      },
      transparent: false,
      vertexShader: vertShader, //document.getElementById("vertexShader").textContent,
      fragmentShader: fragShader //document.getElementById("fragmentShader").textContent
    })

    const mesh = new Points(geometry, material)
    const scaler = 2
    mesh.scale.set(scaler, scaler, scaler)
    mesh.position.set(-1, 1, 0)
    this.model.add(mesh)
  }

  async preload() {
    /*
    let { file } = this

    if (!file.endsWith('.js')) {
      file += '.js'
    }

    if (!file.startsWith('/')) {
      file = `${this.W.STATIC_URL}/latk/${file}`
    }
    */

    //const { latk } = await import(file)

    /*
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
    */
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
    //this.light.intensity = Math.random() + 1.0;

    /*
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
    */  
  }

  /*
  drawStroke(stroke) {
    const points = []

    for (let i = 0; i < stroke.points.length - 1; i++) {
      points.push(stroke.points[i])
      points.push(stroke.points[i + 1])
    }

    return points
  }
  */
}
