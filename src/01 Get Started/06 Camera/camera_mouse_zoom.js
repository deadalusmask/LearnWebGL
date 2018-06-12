import * as glm from 'gl-matrix'

import Shader from './../../shader'
import vsSource from './../05 Coordinate Systems/coordinate_systems.vs'
import fsSource from './../05 Coordinate Systems/coordinate_systems.fs'

import wall from './../../assets/wall.jpg'
import Avatar from './../../assets/Avatar.png'

async function init() {
  document.body.style.margin = 0
  document.body.style.overflow = 'hidden'
  let canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  // camera
  let cameraPos = glm.vec3.fromValues(0.0, 0.0, 3.0)
  let cameraFront = glm.vec3.fromValues(0.0, 0.0, -1.0)
  let cameraUp = glm.vec3.fromValues(0.0, 1.0, 0.0)

  let yaw = -90.0 // yaw is initialized to -90.0 degrees since a yaw of 0.0 results in a direction vector pointing to the right so we initially rotate a bit to the left.
  let pitch = 0.0
  let fov = 45.0

  // timting
  let deltaTime = 0.0 // time between current frame and last fram
  let lastFrame = 0.0

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
      console.log('The pointer lock status is now locked')
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)
      document.addEventListener('mousemove', mouse_callback)
      document.addEventListener('wheel', wheel_callback)
    } else {
      console.log('The pointer lock status is now unlocked')
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


  let gl = canvas.getContext('webgl')
  if (!gl) {
    console.error('Unable to initialize WebGL. Your browser or machine may not support it.')
    return
  }
  gl.enable(gl.DEPTH_TEST)

  let shader = new Shader(gl, vsSource, fsSource)
  shader.use()

  let vertices = [
    -0.5, -0.5, -0.5, 0.0, 0.0,
    0.5, -0.5, -0.5, 1.0, 0.0,
    0.5, 0.5, -0.5, 1.0, 1.0,
    0.5, 0.5, -0.5, 1.0, 1.0,
    -0.5, 0.5, -0.5, 0.0, 1.0,
    -0.5, -0.5, -0.5, 0.0, 0.0,

    -0.5, -0.5, 0.5, 0.0, 0.0,
    0.5, -0.5, 0.5, 1.0, 0.0,
    0.5, 0.5, 0.5, 1.0, 1.0,
    0.5, 0.5, 0.5, 1.0, 1.0,
    -0.5, 0.5, 0.5, 0.0, 1.0,
    -0.5, -0.5, 0.5, 0.0, 0.0,

    -0.5, 0.5, 0.5, 1.0, 0.0,
    -0.5, 0.5, -0.5, 1.0, 1.0,
    -0.5, -0.5, -0.5, 0.0, 1.0,
    -0.5, -0.5, -0.5, 0.0, 1.0,
    -0.5, -0.5, 0.5, 0.0, 0.0,
    -0.5, 0.5, 0.5, 1.0, 0.0,

    0.5, 0.5, 0.5, 1.0, 0.0,
    0.5, 0.5, -0.5, 1.0, 1.0,
    0.5, -0.5, -0.5, 0.0, 1.0,
    0.5, -0.5, -0.5, 0.0, 1.0,
    0.5, -0.5, 0.5, 0.0, 0.0,
    0.5, 0.5, 0.5, 1.0, 0.0,

    -0.5, -0.5, -0.5, 0.0, 1.0,
    0.5, -0.5, -0.5, 1.0, 1.0,
    0.5, -0.5, 0.5, 1.0, 0.0,
    0.5, -0.5, 0.5, 1.0, 0.0,
    -0.5, -0.5, 0.5, 0.0, 0.0,
    -0.5, -0.5, -0.5, 0.0, 1.0,

    -0.5, 0.5, -0.5, 0.0, 1.0,
    0.5, 0.5, -0.5, 1.0, 1.0,
    0.5, 0.5, 0.5, 1.0, 0.0,
    0.5, 0.5, 0.5, 1.0, 0.0,
    -0.5, 0.5, 0.5, 0.0, 0.0,
    -0.5, 0.5, -0.5, 0.0, 1.0
  ]
  let cubePositions = [
    [0.0, 0.0, 0.0],
    [2.0, 5.0, -15.0],
    [-1.5, -2.2, -2.5],
    [-3.8, -2.0, -12.3],
    [2.4, -0.4, -3.5],
    [-1.7, 3.0, -7.5],
    [1.3, -2.0, -2.5],
    [1.5, 2.0, -2.5],
    [1.5, 0.2, -1.5],
    [-1.3, 1.0, -1.5]
  ]
  let VBO = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, VBO)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  let aVertexPosition = gl.getAttribLocation(shader.Program, 'aPos')
  gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, true, 20, 0)
  gl.enableVertexAttribArray(aVertexPosition)

  let aTexCoord = gl.getAttribLocation(shader.Program, 'aTexCoord')
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, true, 20, 12)
  gl.enableVertexAttribArray(aTexCoord)

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

  let wallImage = await loadImage(wall)
  let texture1 = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, wallImage)
  gl.generateMipmap(gl.TEXTURE_2D)

  let AvatarImage = await loadImage(Avatar)
  let texture2 = gl.createTexture()
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, texture2)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, AvatarImage)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  shader.setInt('texture1', 0)
  shader.setInt('texture2', 1)

  animate()

  function drawScene() {
    gl.clearColor(0.0, 0.5, 1.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture1)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, texture2)

    shader.use()

    let view = glm.mat4.create()
    let center = glm.vec3.create()
    glm.vec3.add(center, cameraPos, cameraFront)
    glm.mat4.lookAt(view, cameraPos, center, cameraUp)
    let projection = glm.mat4.create()
    glm.mat4.perspective(projection, glm.glMatrix.toRadian(fov), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100)
    shader.setMat4('view', view)
    shader.setMat4('projection', projection)

    cubePositions.forEach((element, index) => {
      let model = glm.mat4.create()
      glm.mat4.translate(model, model, glm.vec3.fromValues(...element))
      let angle = 20.0 * index
      glm.mat4.rotate(model, model, glm.glMatrix.toRadian(angle + Date.now() * 0.03), glm.vec3.fromValues(0.1, 0.3, 0.5))
      shader.setMat4('model', model)
      gl.drawArrays(gl.TRIANGLES, 0, 36)
    })
  }

  function animate(timeStamp) {
    let currentFrame = timeStamp
    deltaTime = currentFrame - lastFrame
    lastFrame = currentFrame

    processInput()

    drawScene()
    requestAnimationFrame(animate)
  }

  function processInput() {
    let cameraSpeed = 0.01 * deltaTime
    let temp1 = glm.vec3.create()
    if (currentlyPressedKeys['w']) {
      glm.vec3.scale(temp1, cameraFront, cameraSpeed)
      glm.vec3.add(cameraPos, cameraPos, temp1)
      // cameraPos += cameraSpeed * cameraFront;
    }
    if (currentlyPressedKeys['s']) {
      glm.vec3.scale(temp1, cameraFront, cameraSpeed)
      glm.vec3.sub(cameraPos, cameraPos, temp1)
      // cameraPos -= cameraSpeed * cameraFront;
    }
    if (currentlyPressedKeys['a']) {
      glm.vec3.cross(temp1, cameraFront, cameraUp)
      glm.vec3.normalize(temp1, temp1)
      glm.vec3.scale(temp1, temp1, cameraSpeed)
      glm.vec3.sub(cameraPos, cameraPos, temp1)
      // cameraPos -= glm::normalize(glm::cross(cameraFront, cameraUp)) * cameraSpeed;
    }
    if (currentlyPressedKeys['d']) {
      glm.vec3.cross(temp1, cameraFront, cameraUp)
      glm.vec3.normalize(temp1, temp1)
      glm.vec3.scale(temp1, temp1, cameraSpeed)
      glm.vec3.add(cameraPos, cameraPos, temp1)
      // cameraPos += glm::normalize(glm::cross(cameraFront, cameraUp)) * cameraSpeed;
    }

  }

  function mouse_callback(e) {
    let sensitivity = 0.05
    let xoffset = e.movementX
    let yoffset = -e.movementY

    yaw += xoffset * sensitivity
    pitch += yoffset * sensitivity

    if (pitch > 89.0)
      pitch = 89.0
    if (pitch < -89.0)
      pitch = -89.0

    let front = glm.vec3.create()
    front[0] = Math.cos(glm.glMatrix.toRadian(yaw)) * Math.cos(glm.glMatrix.toRadian(pitch))
    front[1] = Math.sin(glm.glMatrix.toRadian(pitch))
    front[2] = Math.sin(glm.glMatrix.toRadian(yaw)) * Math.cos(glm.glMatrix.toRadian(pitch))
    glm.vec3.normalize(cameraFront, front)
  }

  function wheel_callback(e) {
    console.log(e.wheelDeltaY)
    if (fov >= 1.0 && fov <= 45.0)
      fov -= e.wheelDeltaY / 200
    if (fov <= 1.0)
      fov = 1.0
    if (fov >= 45.0)
      fov = 45.0
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
