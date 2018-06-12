import * as glm from 'gl-matrix'
import * as OBJ from 'webgl-obj-loader'

import Camera from './../../camera'
import Shader from './../../shader'

import vsSource from './normal.vs'
import fsSource from './normal.fs'

import anvilObj from './../../assets/anvil.obj'

import normal from './../../assets/normal.png'

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
      blinn = !blinn
      console.log('blinn:', blinn)
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

  let anvilMesh = new OBJ.Mesh(anvilObj)
  anvilMesh.calculateTangentsAndBitangents()
  OBJ.initMeshBuffers(gl, anvilMesh)


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

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  let normalImg = await loadImage(normal)
  let normalmap = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, normalmap)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, normalImg)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)


  shader.use()
  shader.setInt('normalMap', 0)

  animate()

  function drawScene(timeStamp) {
    gl.clearColor(0.1, 0.1, 0.1, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    let view = camera.getViewMatrix()
    let projection = glm.mat4.create()
    glm.mat4.perspective(projection, glm.glMatrix.toRadian(camera.zoom), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100)


    shader.use()
    shader.setMat4('u_view', view)
    shader.setMat4('u_projection', projection)
    shader.setVec3('u_viewPos', camera.position)
    let lightPos = glm.vec3.fromValues(3.0, 3.0, 3.0)
    glm.vec3.rotateY(lightPos, lightPos, glm.vec3.fromValues(0, 0, 0), timeStamp * 0.001 % 360)
    shader.setVec3('lightPos', lightPos)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, normalmap)

    if (anvilMesh) {
      gl.bindVertexArray(anvilMesh.vao)

      let model = glm.mat4.create()
      shader.setMat4('u_model', model)

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, anvilMesh.indexBuffer)
      gl.drawElements(gl.TRIANGLES, anvilMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0)
      gl.bindVertexArray(null)
    }

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
