import * as glm from 'gl-matrix'

import Camera from './../../camera'
import Shader from './../../shader'
import vsSource from './../04 Lighting maps/lighting_maps.vs'
import fsSource from './multiple_lights.fs'
import lampVsSource from './../01 Colors/lamp.vs'
import lampFsSource from './../01 Colors/lamp.fs'

import box from './../../assets/box.png'
import box_specular from './../../assets/box_specular.png'

async function init(){
    document.body.style.margin = 0
    document.body.style.overflow = 'hidden'
    let canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    document.body.appendChild(canvas)

    // camera
    let camera = new Camera(glm.vec3.fromValues(0.0,  0.0, 5.0))

    // timting
    let deltaTime = 0
    let lastFrame = 0

    // resize window
    window.onresize = function(){
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
    canvas.onclick = function() {
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
    let lampShader = new Shader(gl, lampVsSource, lampFsSource)

    let vertices = [
        // positions       // normals        // texture coords
        -0.5, -0.5, -0.5,  0.0,  0.0, -1.0,  0.0, 0.0,
        0.5, -0.5, -0.5,  0.0,  0.0, -1.0,  1.0, 0.0,
        0.5,  0.5, -0.5,  0.0,  0.0, -1.0,  1.0, 1.0,
        0.5,  0.5, -0.5,  0.0,  0.0, -1.0,  1.0, 1.0,
        -0.5,  0.5, -0.5,  0.0,  0.0, -1.0,  0.0, 1.0,
        -0.5, -0.5, -0.5,  0.0,  0.0, -1.0,  0.0, 0.0,

        -0.5, -0.5,  0.5,  0.0,  0.0,  1.0,  0.0, 0.0,
        0.5, -0.5,  0.5,  0.0,  0.0,  1.0,  1.0, 0.0,
        0.5,  0.5,  0.5,  0.0,  0.0,  1.0,  1.0, 1.0,
        0.5,  0.5,  0.5,  0.0,  0.0,  1.0,  1.0, 1.0,
        -0.5,  0.5,  0.5,  0.0,  0.0,  1.0,  0.0, 1.0,
        -0.5, -0.5,  0.5,  0.0,  0.0,  1.0,  0.0, 0.0,

        -0.5,  0.5,  0.5, -1.0,  0.0,  0.0,  1.0, 0.0,
        -0.5,  0.5, -0.5, -1.0,  0.0,  0.0,  1.0, 1.0,
        -0.5, -0.5, -0.5, -1.0,  0.0,  0.0,  0.0, 1.0,
        -0.5, -0.5, -0.5, -1.0,  0.0,  0.0,  0.0, 1.0,
        -0.5, -0.5,  0.5, -1.0,  0.0,  0.0,  0.0, 0.0,
        -0.5,  0.5,  0.5, -1.0,  0.0,  0.0,  1.0, 0.0,

        0.5,  0.5,  0.5,  1.0,  0.0,  0.0,  1.0, 0.0,
        0.5,  0.5, -0.5,  1.0,  0.0,  0.0,  1.0, 1.0,
        0.5, -0.5, -0.5,  1.0,  0.0,  0.0,  0.0, 1.0,
        0.5, -0.5, -0.5,  1.0,  0.0,  0.0,  0.0, 1.0,
        0.5, -0.5,  0.5,  1.0,  0.0,  0.0,  0.0, 0.0,
        0.5,  0.5,  0.5,  1.0,  0.0,  0.0,  1.0, 0.0,

        -0.5, -0.5, -0.5,  0.0, -1.0,  0.0,  0.0, 1.0,
        0.5, -0.5, -0.5,  0.0, -1.0,  0.0,  1.0, 1.0,
        0.5, -0.5,  0.5,  0.0, -1.0,  0.0,  1.0, 0.0,
        0.5, -0.5,  0.5,  0.0, -1.0,  0.0,  1.0, 0.0,
        -0.5, -0.5,  0.5,  0.0, -1.0,  0.0,  0.0, 0.0,
        -0.5, -0.5, -0.5,  0.0, -1.0,  0.0,  0.0, 1.0,

        -0.5,  0.5, -0.5,  0.0,  1.0,  0.0,  0.0, 1.0,
        0.5,  0.5, -0.5,  0.0,  1.0,  0.0,  1.0, 1.0,
        0.5,  0.5,  0.5,  0.0,  1.0,  0.0,  1.0, 0.0,
        0.5,  0.5,  0.5,  0.0,  1.0,  0.0,  1.0, 0.0,
        -0.5,  0.5,  0.5,  0.0,  1.0,  0.0,  0.0, 0.0,
        -0.5,  0.5, -0.5,  0.0,  1.0,  0.0,  0.0, 1.0
    ]

    let cubePositions = [
        [ 0.0,  0.0,  0.0],
        [ 2.0,  5.0, -15.0],
        [-1.5, -2.2, -2.5],
        [-3.8, -2.0, -12.3],
        [ 2.4, -0.4, -3.5],
        [-1.7,  3.0, -7.5],
        [ 1.3, -2.0, -2.5],
        [ 1.5,  2.0, -2.5],
        [ 1.5,  0.2, -1.5],
        [-1.3,  1.0, -1.5]
    ]

    let pointLightPositions = [
        [0.7,  0.2,  2.0],
        [2.3, -3.3, -4.0],
        [4.0,  2.0, -12.0],
        [0.0,  0.0, -3.0]
    ]

    let VBO = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

    let aVertexPosition = gl.getAttribLocation(shader.Program, 'aPos')
    gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, true, 32, 0)
    gl.enableVertexAttribArray(aVertexPosition)

    let aNormal = gl.getAttribLocation(shader.Program, 'aNormal')
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, true, 32, 12)
    gl.enableVertexAttribArray(aNormal)

    let aTexCoord = gl.getAttribLocation(shader.Program, 'aTexCoord')
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, true, 32, 24)
    gl.enableVertexAttribArray(aTexCoord)

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    let BoxDiffuse = await loadImage(box)
    let diffuse = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, diffuse)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, BoxDiffuse)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    let boxSpecular = await loadImage(box_specular)
    let specular = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, specular)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, boxSpecular)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    shader.use()
    shader.setInt('material.diffuse', 0)
    shader.setInt('material.specular', 1)

    animate()

    function drawScene(timeStamp) {
        gl.clearColor(0.1, 0.1, 0.1, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        shader.use()

        shader.setVec3('viewPos', camera.position)

        // light properties
        shader.setVec3('dirLight.direction', glm.vec3.fromValues(-0.2, -1.0, -0.3))
        shader.setVec3('dirLight.ambient', glm.vec3.fromValues(0.05, 0.05, 0.05))
        shader.setVec3('dirLight.diffuse', glm.vec3.fromValues(0.4, 0.4, 0.4))
        shader.setVec3('dirLight.specular', glm.vec3.fromValues(0.5, 0.5, 0.5))
        // point light 1
        shader.setVec3('pointLights[0].position', pointLightPositions[0])
        shader.setVec3('pointLights[0].ambient', glm.vec3.fromValues(0.05, 0.05, 0.05))
        shader.setVec3('pointLights[0].diffuse', glm.vec3.fromValues(0.8, 0.8, 0.8))
        shader.setVec3('pointLights[0].specular', glm.vec3.fromValues(1.0, 1.0, 1.0))
        shader.setFloat('pointLights[0].constant', 1.0)
        shader.setFloat('pointLights[0].linear', 0.09)
        shader.setFloat('pointLights[0].quadratic', 0.032)
        // point light 2
        shader.setVec3('pointLights[1].position', pointLightPositions[1])
        shader.setVec3('pointLights[1].ambient', glm.vec3.fromValues(0.05, 0.05, 0.05))
        shader.setVec3('pointLights[1].diffuse', glm.vec3.fromValues(0.8, 0.8, 0.8))
        shader.setVec3('pointLights[1].specular', glm.vec3.fromValues(1.0, 1.0, 1.0))
        shader.setFloat('pointLights[1].constant', 1.0)
        shader.setFloat('pointLights[1].linear', 0.09)
        shader.setFloat('pointLights[1].quadratic', 0.032)
        // point light 3
        shader.setVec3('pointLights[2].position', pointLightPositions[2])
        shader.setVec3('pointLights[2].ambient', glm.vec3.fromValues(0.05, 0.05, 0.05))
        shader.setVec3('pointLights[2].diffuse', glm.vec3.fromValues(0.8, 0.8, 0.8))
        shader.setVec3('pointLights[2].specular', glm.vec3.fromValues(1.0, 1.0, 1.0))
        shader.setFloat('pointLights[2].constant', 1.0)
        shader.setFloat('pointLights[2].linear', 0.09)
        shader.setFloat('pointLights[2].quadratic', 0.032)
        // point light 4
        shader.setVec3('pointLights[3].position', pointLightPositions[3])
        shader.setVec3('pointLights[3].ambient', glm.vec3.fromValues(0.05, 0.05, 0.05))
        shader.setVec3('pointLights[3].diffuse', glm.vec3.fromValues(0.8, 0.8, 0.8))
        shader.setVec3('pointLights[3].specular', glm.vec3.fromValues(1.0, 1.0, 1.0))
        shader.setFloat('pointLights[3].constant', 1.0)
        shader.setFloat('pointLights[3].linear', 0.09)
        shader.setFloat('pointLights[3].quadratic', 0.032)
        // spotLight
        shader.setVec3('spotLight.position', camera.position)
        shader.setVec3('spotLight.direction', camera.front)
        shader.setVec3('spotLight.ambient', glm.vec3.fromValues(0.0, 0.0, 0.0))
        shader.setVec3('spotLight.diffuse', glm.vec3.fromValues(1.0, 1.0, 1.0))
        shader.setVec3('spotLight.specular', glm.vec3.fromValues(1.0, 1.0, 1.0))
        shader.setFloat('spotLight.constant', 1.0)
        shader.setFloat('spotLight.linear', 0.09)
        shader.setFloat('spotLight.quadratic', 0.032)
        shader.setFloat('spotLight.cutOff', Math.cos(glm.glMatrix.toRadian(12.5)))
        shader.setFloat('spotLight.outerCutOff', Math.cos(glm.glMatrix.toRadian(15.0)))

        // material properties
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, diffuse)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, specular)
        shader.setFloat('material.shininess', 64.0)

        let view = camera.getViewMatrix()
        shader.setMat4('view', view)

        let projection = glm.mat4.create()
        glm.mat4.perspective(projection, glm.glMatrix.toRadian(camera.zoom), gl.canvas.clientWidth/gl.canvas.clientHeight, 0.1, 100)
        shader.setMat4('projection', projection)

        cubePositions.forEach((element, index)=>{
            let model = glm.mat4.create()
            glm.mat4.translate(model, model, glm.vec3.fromValues(...element))
            let angle = 20.0 * index
            glm.mat4.rotate(model, model, glm.glMatrix.toRadian(angle), glm.vec3.fromValues(0.1, 0.3, 0.5))
            shader.setMat4('model', model)

            let normalMatrix = glm.mat3.create()
            glm.mat3.fromMat4(normalMatrix, model)
            glm.mat3.invert(normalMatrix, normalMatrix)
            glm.mat3.transpose(normalMatrix, normalMatrix)
            shader.setMat3('normalMatrix', normalMatrix)

            gl.drawArrays(gl.TRIANGLES, 0, 36)
        })


        lampShader.use()
        lampShader.setMat4('projection', projection)
        lampShader.setMat4('view', view)
        pointLightPositions.forEach((element, index)=>{
            let model = glm.mat4.create()
            glm.mat4.translate(model, model, glm.vec3.fromValues(...element))
            glm.mat4.scale(model, model, glm.vec3.fromValues(0.2, 0.2, 0.2))
            lampShader.setMat4('model', model);
            gl.drawArrays(gl.TRIANGLES, 0, 36);
        })

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

        if(currentlyPressedKeys['w']){
            camera.processKeyboard(Camera.Movement.FORWARD, deltaTime)
        }
        if(currentlyPressedKeys['s']){
            camera.processKeyboard(Camera.Movement.BACKWARD, deltaTime)
        }
        if(currentlyPressedKeys['a']){
            camera.processKeyboard(Camera.Movement.LEFT, deltaTime)
        }
        if(currentlyPressedKeys['d']){
            camera.processKeyboard(Camera.Movement.RIGHT, deltaTime)
        }
        if(currentlyPressedKeys[' ']){
            camera.processKeyboard(Camera.Movement.UP, deltaTime)
        }
        if(currentlyPressedKeys['Control']){
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

function loadImage(src){
    return new Promise((resolve, reject) => {
      let img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
}

init()