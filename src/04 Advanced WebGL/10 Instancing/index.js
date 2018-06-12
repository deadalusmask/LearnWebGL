import * as glm from 'gl-matrix'
import * as OBJ from 'webgl-obj-loader'

import Camera from './../../camera'
import Shader from './../../shader'

import vsSource from './tran.vs'
import fsSource from './tran.fs'
import instancedVsSource from './instanced.vs'

import suzanneObj from './../../assets/suzanne.obj'

import wood from './../../assets/WoodFineDark004_COL_3K.jpg'

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

  let shader = new Shader(gl, instancedVsSource, fsSource)

  let suzanneMesh = new OBJ.Mesh(suzanneObj)
  OBJ.initMeshBuffers(gl, suzanneMesh)

  let amount = 50
  let exData = []
  for (let i = 0; i < amount; i++) {
    exData[6 * i] = Math.random() * 30 - 15
    exData[6 * i + 1] = 0
    exData[6 * i + 2] = Math.random() * 30 - 15
    exData[6 * i + 3] = Math.random()
    exData[6 * i + 4] = Math.random()
    exData[6 * i + 5] = Math.random()

  }

  // Init suzanne
  {
    suzanneMesh.a_position = gl.getAttribLocation(shader.Program, 'a_position')
    suzanneMesh.a_texCoord = gl.getAttribLocation(shader.Program, 'a_texCoord')
    suzanneMesh.a_normal = gl.getAttribLocation(shader.Program, 'a_normal')

    suzanneMesh.a_tran = gl.getAttribLocation(shader.Program, 'a_tran')
    suzanneMesh.a_color = gl.getAttribLocation(shader.Program, 'a_color')

    suzanneMesh.extBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, suzanneMesh.extBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(exData), gl.STATIC_DRAW)

    suzanneMesh.vao = gl.createVertexArray()
    gl.bindVertexArray(suzanneMesh.vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, suzanneMesh.vertexBuffer)
    gl.vertexAttribPointer(suzanneMesh.a_position, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(suzanneMesh.a_position)
    gl.bindBuffer(gl.ARRAY_BUFFER, suzanneMesh.textureBuffer)
    gl.vertexAttribPointer(suzanneMesh.a_texCoord, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(suzanneMesh.a_texCoord)
    gl.bindBuffer(gl.ARRAY_BUFFER, suzanneMesh.normalBuffer)
    gl.vertexAttribPointer(suzanneMesh.a_normal, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(suzanneMesh.a_normal)

    gl.bindBuffer(gl.ARRAY_BUFFER, suzanneMesh.extBuffer)
    gl.vertexAttribPointer(suzanneMesh.a_tran, 3, gl.FLOAT, false, 24, 0)
    gl.enableVertexAttribArray(suzanneMesh.a_tran)
    gl.vertexAttribPointer(suzanneMesh.a_color, 3, gl.FLOAT, false, 24, 12)
    gl.enableVertexAttribArray(suzanneMesh.a_color)

    gl.vertexAttribDivisor(suzanneMesh.a_tran, 1)
    gl.vertexAttribDivisor(suzanneMesh.a_color, 1)

    gl.bindVertexArray(null)
  }

  // let sphereMesh = new OBJ.Mesh(sphereObj)
  // OBJ.initMeshBuffers(gl, sphereMesh)

  let woodImg = await loadImage(wood)
  let diffuse = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, diffuse)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, woodImg)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

  shader.use()
  shader.setInt('diffuse', 0)

  animate()

  function drawScene(timeStamp) {
    let view = camera.getViewMatrix()
    let projection = glm.mat4.create()
    glm.mat4.perspective(projection, glm.glMatrix.toRadian(camera.zoom), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100)


    shader.use()
    shader.setMat4('u_view', view)
    shader.setMat4('u_projection', projection)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, diffuse)
    // draw monkey
    if (suzanneMesh) {
      gl.bindVertexArray(suzanneMesh.vao)

      // let model = glm.mat4.create()
      // shader.setMat4('u_model', model)

      // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, suzanneMesh.indexBuffer)
      // gl.drawElements(gl.TRIANGLES, suzanneMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0)
      // gl.bindVertexArray(null)

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, suzanneMesh.indexBuffer)
      gl.drawElementsInstanced(gl.TRIANGLES, suzanneMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0, amount)
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
