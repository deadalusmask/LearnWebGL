import * as glm from 'gl-matrix'
import * as OBJ from 'webgl-obj-loader'

import Camera from './../../camera'
import Shader from './../../shader'
import vsSource from './model_loading.vs'
import fsSource from './model_loading.fs'

import suzanneObj from './../../assets/suzanne.obj'
import wood from './../../assets/WoodFineDark004_COL_3K.jpg'

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


    var suzanneMesh = new OBJ.Mesh(suzanneObj)
    OBJ.initMeshBuffers(gl, suzanneMesh)

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    let woodTex = await loadImage(wood)
    let diffuse = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, diffuse)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, woodTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)


    shader.use()
    shader.setInt('material.diffuse', 0)

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

        // material properties
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, diffuse)
        shader.setFloat('material.shininess', 16.0)

        let view = camera.getViewMatrix()
        shader.setMat4('view', view)

        let projection = glm.mat4.create()
        glm.mat4.perspective(projection, glm.glMatrix.toRadian(camera.zoom), gl.canvas.clientWidth/gl.canvas.clientHeight, 0.1, 100)
        shader.setMat4('projection', projection)

        if(suzanneMesh) {
            let aVertexPosition =  gl.getAttribLocation(shader.Program, 'aPos')
            gl.bindBuffer(gl.ARRAY_BUFFER, suzanneMesh.vertexBuffer)
            gl.vertexAttribPointer(aVertexPosition, suzanneMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(aVertexPosition)

            if(suzanneMesh.textures.length){
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