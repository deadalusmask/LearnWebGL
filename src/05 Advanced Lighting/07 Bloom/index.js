import * as glm from 'gl-matrix'
import * as OBJ from 'webgl-obj-loader'

import Camera from './../../camera'
import Shader from './../../shader'

import vsSource from './normal.vs'
import fsSource from './pointLightWithNormal.fs'
import lampVsSource from './instancedLamp.vs'
import lampFsSource from './lamp.fs'
import blurVsSource from './blur.vs'
import blurFsSource from './blur.fs'
import bloomShaderVsSource from './bloom.vs'
import bloomShaderFsSource from './bloom.fs'

import anvilObj from './../../assets/anvil.obj'
import normal from './../../assets/normal.png'

import sphereObj from './../../assets/sphere.obj'

async function init() {
  document.body.style.margin = 0
  document.body.style.overflow = 'hidden'
  let canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  // camera
  let camera = new Camera(glm.vec3.fromValues(0.0, 0.0, 5.0))

  // timting
  let deltaTime = 0
  let lastFrame = 0

  // resize window
  window.onresize = function () {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    drawScene()
  }

  //capture keyboard input
  let currentlyPressedKeys = {}

  //capture cursor
  canvas.requestPointerLock = canvas.requestPointerLock ||
    canvas.mozRequestPointerLock
  document.exitPointerLock = document.exitPointerLock ||
    document.mozExitPointerLock
  canvas.onclick = function () {
    canvas.requestPointerLock()
  }

  document.addEventListener('pointerlockchange', handleLockChange, false)
  document.addEventListener('mozpointerlockchange', handleLockChange, false)

  function handleLockChange() {
    if (document.pointerLockElement === canvas ||
      document.mozPointerLockElement === canvas) {
      // console.log('The pointer lock status is now locked')
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)
      document.addEventListener('mousemove', mouse_callback)
      document.addEventListener('wheel', wheel_callback)
    } else {
      // console.log('The pointer lock status is now unlocked')
      document.removeEventListener('mousemove', mouse_callback)
      document.removeEventListener('wheel', wheel_callback)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }

  function handleKeyDown(event) {
    currentlyPressedKeys[event.key] = true
    if (event.key === 'b') {
      brightOnly = !brightOnly
      console.log('brightOnly:', brightOnly)
    }
  }
  function handleKeyUp(event) {
    currentlyPressedKeys[event.key] = false
  }


  let gl = canvas.getContext('webgl2')
  if (!gl) {
    console.error('Unable to initialize WebGL. Your browser or machine may not support it.')
    return
  }


  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.enable(gl.CULL_FACE)

  let shader = new Shader(gl, vsSource, fsSource)
  let lampShader = new Shader(gl, lampVsSource, lampFsSource)
  let blurShader = new Shader(gl, blurVsSource, blurFsSource)
  let bloomShader = new Shader(gl, bloomShaderVsSource, bloomShaderFsSource)

  let pointLightLocations = [
    1.0, 0.2, 4.0,
    2.3, 0, -4.0,
    -4.0, 0.0, -8.0,
    2.0, 5.0, -2.0
  ]
  let pointLightColors = [
    0, 2, 2,
    4, 0, 0,
    2, 2, 0.5,
    1.2, 1.2, 1.2
  ]
  let quadVertices = [
    // positions     // texture Coords
    -1.0, 1.0, 0.0, 0.0, 1.0,
    -1.0, -1.0, 0.0, 0.0, 0.0,
    1.0, 1.0, 0.0, 1.0, 1.0,
    1.0, -1.0, 0.0, 1.0, 0.0,
  ]

  let quadVAO = gl.createVertexArray()
  let quadVBO = gl.createBuffer()
  gl.bindVertexArray(quadVAO)
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVertices), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 3, gl.FLOAT, true, 20, 0)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribPointer(1, 2, gl.FLOAT, true, 20, 12)
  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  let anvilMesh = new OBJ.Mesh(anvilObj)
  anvilMesh.calculateTangentsAndBitangents()
  OBJ.initMeshBuffers(gl, anvilMesh)

  let sphereMesh = new OBJ.Mesh(sphereObj)
  OBJ.initMeshBuffers(gl, sphereMesh)
  // Init anvil
  {
    anvilMesh.a_position = gl.getAttribLocation(shader.Program, 'a_position')
    anvilMesh.a_texCoord = gl.getAttribLocation(shader.Program, 'a_texCoord')
    anvilMesh.a_normal = gl.getAttribLocation(shader.Program, 'a_normal')

    anvilMesh.a_tangent = gl.getAttribLocation(shader.Program, 'a_tangent')
    anvilMesh.a_bitangent = gl.getAttribLocation(shader.Program, 'a_bitangent')

    anvilMesh.tengentBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, anvilMesh.tengentBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(anvilMesh.tangents), gl.STATIC_DRAW)
    anvilMesh.bitangentBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, anvilMesh.bitangentBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(anvilMesh.bitangents), gl.STATIC_DRAW)


    anvilMesh.vao = gl.createVertexArray()
    gl.bindVertexArray(anvilMesh.vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, anvilMesh.vertexBuffer)
    gl.vertexAttribPointer(anvilMesh.a_position, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(anvilMesh.a_position)
    gl.bindBuffer(gl.ARRAY_BUFFER, anvilMesh.textureBuffer)
    gl.vertexAttribPointer(anvilMesh.a_texCoord, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(anvilMesh.a_texCoord)
    gl.bindBuffer(gl.ARRAY_BUFFER, anvilMesh.normalBuffer)
    gl.vertexAttribPointer(anvilMesh.a_normal, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(anvilMesh.a_normal)

    gl.bindBuffer(gl.ARRAY_BUFFER, anvilMesh.tengentBuffer)
    gl.vertexAttribPointer(anvilMesh.a_tangent, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(anvilMesh.a_tangent)
    gl.bindBuffer(gl.ARRAY_BUFFER, anvilMesh.bitangentBuffer)
    gl.vertexAttribPointer(anvilMesh.a_bitangent, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(anvilMesh.a_bitangent)

    gl.bindVertexArray(null)
  }

  // Init sphere
  {
    sphereMesh.a_position = gl.getAttribLocation(lampShader.Program, 'a_position')
    // sphereMesh.a_texCoord = gl.getAttribLocation(lampShader.Program, 'a_texCoord')
    // sphereMesh.a_normal = gl.getAttribLocation(lampShader.Program, 'a_normal')

    sphereMesh.a_location = gl.getAttribLocation(lampShader.Program, 'a_location')
    sphereMesh.a_color = gl.getAttribLocation(lampShader.Program, 'a_color')

    sphereMesh.locationBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.locationBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointLightLocations), gl.STATIC_DRAW)

    sphereMesh.colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointLightColors), gl.STATIC_DRAW)


    sphereMesh.vao = gl.createVertexArray()
    gl.bindVertexArray(sphereMesh.vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.vertexBuffer)
    gl.vertexAttribPointer(sphereMesh.a_position, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(sphereMesh.a_position)
    // gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.textureBuffer)
    // gl.vertexAttribPointer(sphereMesh.a_texCoord, 2, gl.FLOAT, false, 0, 0)
    // gl.enableVertexAttribArray(sphereMesh.a_texCoord)
    // gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.normalBuffer)
    // gl.vertexAttribPointer(sphereMesh.a_normal, 3, gl.FLOAT, false, 0, 0)
    // gl.enableVertexAttribArray(sphereMesh.a_normal)

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.locationBuffer)
    gl.vertexAttribPointer(sphereMesh.a_location, 3, gl.FLOAT, false, 12, 0)
    gl.enableVertexAttribArray(sphereMesh.a_location)
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.colorBuffer)
    gl.vertexAttribPointer(sphereMesh.a_color, 3, gl.FLOAT, false, 12, 0)
    gl.enableVertexAttribArray(sphereMesh.a_color)

    gl.vertexAttribDivisor(sphereMesh.a_location, 1)
    gl.vertexAttribDivisor(sphereMesh.a_color, 1)

    gl.bindVertexArray(null)
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  let normalImg = await loadImage(normal)
  let normalmap = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, normalmap)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, normalImg)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)



  // framebuffer configuration
  let framebuffer = gl.createFramebuffer()
  framebuffer.width = gl.canvas.clientWidth
  framebuffer.height = gl.canvas.clientHeight
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

  // create a color attachment texture
  let textureColorbuffers = Array.apply(null, new Array(2))
  textureColorbuffers.forEach((v, i) => {
    textureColorbuffers[i] = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, textureColorbuffers[i])
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, framebuffer.width, framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, textureColorbuffers[i], 0)
  })

  let renderbuffer = gl.createRenderbuffer()
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, framebuffer.width, framebuffer.height)
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer)

  let attachments = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]
  gl.drawBuffers(attachments)

  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.bindRenderbuffer(gl.RENDERBUFFER, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  let pingpongFBO = []
  let pingpongColorbuffers = []
  for (let i = 0; i < 2; i++) {
    pingpongFBO[i] = gl.createFramebuffer()
    pingpongFBO[i].width = gl.canvas.clientWidth
    pingpongFBO[i].height = gl.canvas.clientHeight
    pingpongColorbuffers[i] = gl.createTexture()
    gl.bindFramebuffer(gl.FRAMEBUFFER, pingpongFBO[i])
    gl.bindTexture(gl.TEXTURE_2D, pingpongColorbuffers[i])
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, pingpongFBO[i].width, pingpongFBO[i].height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pingpongColorbuffers[i], 0)
  }

  shader.use()
  shader.setInt('normalMap', 0)
  shader.setFloat('material.shininess', 64.0)
  shader.setVec3('material.diffuseColor', [0.69, 0.75, 0.77])
  blurShader.use()
  blurShader.setInt('image', 0)
  bloomShader.use()
  bloomShader.setInt('scene', 0)
  bloomShader.setInt('bloomBlur', 1)
  bloomShader.setInt('bloom', true)
  bloomShader.setFloat('exposure', 1.0)


  let brightOnly = false
  console.log('press B to switch between normal mode and bright only mode')

  animate()

  function drawScene(timeStamp) {
    gl.clearColor(0, 0, 0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    let view = camera.getViewMatrix()
    let projection = glm.mat4.create()
    glm.mat4.perspective(projection, glm.glMatrix.toRadian(camera.zoom), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100)

    shader.use()
    shader.setMat4('u_view', view)
    shader.setMat4('u_projection', projection)
    shader.setVec3('u_viewPos', camera.position)

    for (let i = 0; i < 4; i++) {
      shader.setVec3('pointLights[' + i + '].position', pointLightLocations.slice(i * 3, i * 3 + 3))
      shader.setVec3('pointLights[' + i + '].ambient', [0.05, 0.05, 0.05])
      shader.setVec3('pointLights[' + i + '].diffuse', pointLightColors.slice(i * 3, i * 3 + 3))
      shader.setVec3('pointLights[' + i + '].specular', pointLightColors.slice(i * 3, i * 3 + 3))
      shader.setFloat('pointLights[' + i + '].constant', 1.0)
      shader.setFloat('pointLights[' + i + '].linear', 0.09)
      shader.setFloat('pointLights[' + i + '].quadratic', 0.032)
    }

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, normalmap)

    if (anvilMesh) {
      gl.bindVertexArray(anvilMesh.vao)

      let model = glm.mat4.create()
      glm.mat4.translate(model, model, [0, -1, 0])
      shader.setMat4('u_model', model)

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, anvilMesh.indexBuffer)
      gl.drawElements(gl.TRIANGLES, anvilMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0)
      gl.bindVertexArray(null)
    }


    //draw lamps
    lampShader.use()
    lampShader.setMat4('u_view', view)
    lampShader.setMat4('u_projection', projection)
    gl.bindVertexArray(sphereMesh.vao)
    let model = glm.mat4.create()
    glm.mat4.scale(model, model, [0.2, 0.2, 0.2])
    lampShader.setMat4('u_model', model)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereMesh.indexBuffer)
    gl.drawElementsInstanced(gl.TRIANGLES, sphereMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0, 4)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)


    // blur bright fragments with two-pass Gaussian Blur
    let horizontal = true, first_iteration = true
    let amount = 6
    blurShader.use()
    for (let i = 0; i < amount; i++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, pingpongFBO[Number(horizontal)])
      blurShader.setInt('horizontal', horizontal)
      gl.bindTexture(gl.TEXTURE_2D, first_iteration ? textureColorbuffers[1] : pingpongColorbuffers[Number(!horizontal)])

      gl.bindVertexArray(quadVAO)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.bindVertexArray(null)

      horizontal = !horizontal
      if (first_iteration) {
        first_iteration = false
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)


    // now render floating point color buffer to 2D quad and tonemap HDR colors to default framebuffer's (clamped) color range
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    bloomShader.use()
    gl.activeTexture(gl.TEXTURE0)
    if (brightOnly) {
      gl.bindTexture(gl.TEXTURE_2D, textureColorbuffers[1])
    } else {
      gl.bindTexture(gl.TEXTURE_2D, textureColorbuffers[0])
    }
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, pingpongColorbuffers[0])
    gl.bindVertexArray(quadVAO)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.bindVertexArray(null)
  }

  function animate(timeStamp) {
    let currentFrame = timeStamp
    deltaTime = currentFrame - lastFrame
    lastFrame = currentFrame

    processInput()

    drawScene(timeStamp)
    requestAnimationFrame(animate)
  }

  function processInput() {

    if (currentlyPressedKeys['w']) {
      camera.processKeyboard(Camera.Movement.FORWARD, deltaTime)
    }
    if (currentlyPressedKeys['s']) {
      camera.processKeyboard(Camera.Movement.BACKWARD, deltaTime)
    }
    if (currentlyPressedKeys['a']) {
      camera.processKeyboard(Camera.Movement.LEFT, deltaTime)
    }
    if (currentlyPressedKeys['d']) {
      camera.processKeyboard(Camera.Movement.RIGHT, deltaTime)
    }
    if (currentlyPressedKeys[' ']) {
      camera.processKeyboard(Camera.Movement.UP, deltaTime)
    }
    if (currentlyPressedKeys['Shift']) {
      camera.processKeyboard(Camera.Movement.DOWN, deltaTime)
    }
  }

  function mouse_callback(e) {
    let xoffset = e.movementX
    let yoffset = -e.movementY
    camera.processMouseMovement(xoffset, yoffset)
  }

  function wheel_callback(e) {
    camera.processMouseScroll(e.wheelDeltaY)
  }


}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    let img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

init()
