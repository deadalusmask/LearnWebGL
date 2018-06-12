import * as glm from 'gl-matrix'
import * as OBJ from 'webgl-obj-loader'

import Camera from './../../camera'
import Shader from './../../shader'

import vsSource from './model.vs'
import fsSource from './model.fs'
import skyboxVsSource from './skybox.vs'
import skyboxFsSource from './skybox.fs'

import suzanneObj from './../../assets/suzanne.obj'


const faces = ['right', 'left', 'top', 'bottom', 'back', 'front'].map((element) => {
  return require('./../../assets/skybox/' + element + '.jpg')
})

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


  let gl = canvas.getContext('webgl', { stencil: true })
  if (!gl) {
    console.error('Unable to initialize WebGL. Your browser or machine may not support it.')
    return
  }

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.enable(gl.CULL_FACE)

  let shader = new Shader(gl, vsSource, fsSource)
  let skyboxShader = new Shader(gl, skyboxVsSource, skyboxFsSource)

  let suzanneMesh = new OBJ.Mesh(suzanneObj)
  OBJ.initMeshBuffers(gl, suzanneMesh)


  let skyboxVertices = [
    // positions
    -1.0, 1.0, -1.0,
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, 1.0, -1.0,
    -1.0, 1.0, -1.0,

    -1.0, -1.0, 1.0,
    -1.0, -1.0, -1.0,
    -1.0, 1.0, -1.0,
    -1.0, 1.0, -1.0,
    -1.0, 1.0, 1.0,
    -1.0, -1.0, 1.0,

    1.0, -1.0, -1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, -1.0,
    1.0, -1.0, -1.0,

    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,
    -1.0, -1.0, 1.0,

    -1.0, 1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,
    -1.0, 1.0, -1.0,

    -1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0
  ]

  let skyboxVBO = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, skyboxVBO)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skyboxVertices), gl.STATIC_DRAW)


  let skyboxTexture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture)
  let promises = faces.map((element) => {
    return loadImage(element)
  })
  let faceImgs = await Promise.all(promises)
  faceImgs.forEach((element, index) => {
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + index, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element)
  })
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR)


  shader.use()
  shader.setInt('skybox', 0)

  skyboxShader.use()
  skyboxShader.setInt('skybox', 0)


  animate()

  function drawScene(timeStamp) {
    let view = camera.getViewMatrix()
    let projection = glm.mat4.create()
    glm.mat4.perspective(projection, glm.glMatrix.toRadian(camera.zoom), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100)


    // draw skybox
    gl.depthFunc(gl.LEQUAL)
    skyboxShader.use()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture)
    let skyboxView = glm.mat4.create()
    glm.mat4.copy(skyboxView, view)
    skyboxView[3] = 0
    skyboxView[7] = 0
    skyboxView[11] = 0
    skyboxView[12] = 0
    skyboxView[13] = 0
    skyboxView[14] = 0
    skyboxView[15] = 1
    skyboxShader.setMat4('view', skyboxView)
    skyboxShader.setMat4('projection', projection)

    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxVBO)
    let aVertexPosition = gl.getAttribLocation(shader.Program, 'aPos')
    gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, true, 12, 0)
    gl.enableVertexAttribArray(aVertexPosition)

    gl.drawArrays(gl.TRIANGLES, 0, 36)

    gl.depthFunc(gl.LESS)


    // draw others
    shader.use()

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture)

    shader.setVec3('viewPos', camera.position)
    shader.setMat4('view', view)
    shader.setMat4('projection', projection)
    // draw monkey
    if (suzanneMesh) {
      let aVertexPosition = gl.getAttribLocation(shader.Program, 'aPos')
      gl.bindBuffer(gl.ARRAY_BUFFER, suzanneMesh.vertexBuffer)
      gl.vertexAttribPointer(aVertexPosition, suzanneMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(aVertexPosition)

      if (suzanneMesh.textures.length) {
        let aTexCoord = gl.getAttribLocation(shader.Program, 'aTexCoord')
        gl.bindBuffer(gl.ARRAY_BUFFER, suzanneMesh.textureBuffer)
        gl.vertexAttribPointer(aTexCoord, suzanneMesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(aTexCoord)
      }

      let aNormal = gl.getAttribLocation(shader.Program, 'aNormal')
      gl.bindBuffer(gl.ARRAY_BUFFER, suzanneMesh.normalBuffer)
      gl.vertexAttribPointer(aNormal, suzanneMesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(aNormal)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, suzanneMesh.indexBuffer)

      let model = glm.mat4.create()
      shader.setMat4('model', model)

      let normalMatrix = glm.mat3.create()
      glm.mat3.fromMat4(normalMatrix, model)
      glm.mat3.invert(normalMatrix, normalMatrix)
      glm.mat3.transpose(normalMatrix, normalMatrix)
      shader.setMat3('normalMatrix', normalMatrix)

      gl.drawElements(gl.TRIANGLES, suzanneMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0)
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
