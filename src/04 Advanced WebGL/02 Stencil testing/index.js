import * as glm from 'gl-matrix'
import * as OBJ from 'webgl-obj-loader'

import Camera from './../../camera'
import Shader from './../../shader'

import vsSource from './../../03 Model Loading/model_loading.vs'
import fsSource from './../../03 Model Loading/model_loading.fs'
import singleColorVsSource from './single_color.vs'
import singleColorFsSource from './single_color.fs'

import suzanneObj from './../../assets/suzanne.obj'
import planeObj from './../../assets/plane.obj'
import sphereObj from './../../assets/sphere.obj'

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


    let gl = canvas.getContext('webgl', {stencil: true})
    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser or machine may not support it.')
        return
    }

    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LESS)
    gl.enable(gl.STENCIL_TEST)
    gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF)
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE)

    let shader = new Shader(gl, vsSource, fsSource)
    let singleColorShader = new Shader(gl, singleColorVsSource, singleColorFsSource)

    let suzanneMesh = new OBJ.Mesh(suzanneObj)
    OBJ.initMeshBuffers(gl, suzanneMesh)
    let planeMesh = new OBJ.Mesh(planeObj)
    OBJ.initMeshBuffers(gl, planeMesh)
    let sphereMesh = new OBJ.Mesh(sphereObj)
    OBJ.initMeshBuffers(gl, sphereMesh)
    let spherePositions = [
        [1, 0, 3],
        [3, 0, -4]
    ]


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
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)

        let view = camera.getViewMatrix()
        let projection = glm.mat4.create()
        glm.mat4.perspective(projection, glm.glMatrix.toRadian(camera.zoom), gl.canvas.clientWidth/gl.canvas.clientHeight, 0.1, 100)

        shader.use()
        shader.setVec3('viewPos', camera.position)
        shader.setMat4('view', view)
        shader.setMat4('projection', projection)

        // light properties
        shader.setVec3('dirLight.direction', glm.vec3.fromValues(-0.2, -1.0, -0.3))
        shader.setVec3('dirLight.ambient', glm.vec3.fromValues(0.1, 0.1, 0.2))
        shader.setVec3('dirLight.diffuse', glm.vec3.fromValues(0.4, 0.4, 0.4))
        shader.setVec3('dirLight.specular', glm.vec3.fromValues(0.5, 0.5, 0.5))

        // material properties
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, diffuse)
        shader.setFloat('material.shininess', 16.0)


        // draw floor as normal, but don't write the floor to the stencil buffer
        gl.stencilMask(0x00)

        if(planeMesh) {
            let aVertexPosition =  gl.getAttribLocation(shader.Program, 'aPos')
            gl.bindBuffer(gl.ARRAY_BUFFER, planeMesh.vertexBuffer)
            gl.vertexAttribPointer(aVertexPosition, planeMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(aVertexPosition)

            if(planeMesh.textures.length){
                let aTexCoord = gl.getAttribLocation(shader.Program, 'aTexCoord')
                gl.bindBuffer(gl.ARRAY_BUFFER, planeMesh.textureBuffer)
                gl.vertexAttribPointer(aTexCoord, planeMesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0)
                gl.enableVertexAttribArray(aTexCoord)
            }

            let aNormal = gl.getAttribLocation(shader.Program, 'aNormal')
            gl.bindBuffer(gl.ARRAY_BUFFER, planeMesh.normalBuffer)
            gl.vertexAttribPointer(aNormal, planeMesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(aNormal)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, planeMesh.indexBuffer)

            let model = glm.mat4.create()
            glm.mat4.translate(model, model, glm.vec3.fromValues(0.0, -1.0, 0.0))
            glm.mat4.scale(model, model, glm.vec3.fromValues(4.0, 4.0, 4.0))
            shader.setMat4('model', model)

            let normalMatrix = glm.mat3.create()
            glm.mat3.fromMat4(normalMatrix, model)
            glm.mat3.invert(normalMatrix, normalMatrix)
            glm.mat3.transpose(normalMatrix, normalMatrix)
            shader.setMat3('normalMatrix', normalMatrix)

            gl.drawElements(gl.TRIANGLES, planeMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0)
        }


        // draw objects as normal, writing to the stencil buffer
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF)
        gl.stencilMask(0xFF)

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

        if(sphereMesh) {
            let aVertexPosition =  gl.getAttribLocation(shader.Program, 'aPos')
            gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.vertexBuffer)
            gl.vertexAttribPointer(aVertexPosition, sphereMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(aVertexPosition)

            if(sphereMesh.textures.length){
                let aTexCoord = gl.getAttribLocation(shader.Program, 'aTexCoord')
                gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.textureBuffer)
                gl.vertexAttribPointer(aTexCoord, sphereMesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0)
                gl.enableVertexAttribArray(aTexCoord)
            }

            let aNormal = gl.getAttribLocation(shader.Program, 'aNormal')
            gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.normalBuffer)
            gl.vertexAttribPointer(aNormal, sphereMesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(aNormal)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereMesh.indexBuffer)

            spherePositions.forEach(element => {
                let model = glm.mat4.create()
                glm.mat4.translate(model, model, glm.vec3.fromValues(...element))
                shader.setMat4('model', model)

                let normalMatrix = glm.mat3.create()
                glm.mat3.fromMat4(normalMatrix, model)
                glm.mat3.invert(normalMatrix, normalMatrix)
                glm.mat3.transpose(normalMatrix, normalMatrix)
                shader.setMat3('normalMatrix', normalMatrix)

                gl.drawElements(gl.TRIANGLES, sphereMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0)
            })


        }

        // now draw slightly scaled versions of the objects, this time disabling stencil writing
        gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF)
        gl.stencilMask(0x00) // 禁止模板缓冲的写入
        gl.disable(gl.DEPTH_TEST)

        singleColorShader.use()
        singleColorShader.setMat4('view', view)
        singleColorShader.setMat4('projection', projection)

        let scale = 1.1

        if(suzanneMesh) {
            let aVertexPosition =  gl.getAttribLocation(singleColorShader.Program, 'aPos')
            gl.bindBuffer(gl.ARRAY_BUFFER, suzanneMesh.vertexBuffer)
            gl.vertexAttribPointer(aVertexPosition, suzanneMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(aVertexPosition)

            let model = glm.mat4.create()
            glm.mat4.scale(model, model, glm.vec3.fromValues(scale, scale, scale))
            singleColorShader.setMat4('model', model)

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, suzanneMesh.indexBuffer)
            gl.drawElements(gl.TRIANGLES, suzanneMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0)

        }

        if(sphereMesh) {
            let aVertexPosition =  gl.getAttribLocation(singleColorShader.Program, 'aPos')
            gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.vertexBuffer)
            gl.vertexAttribPointer(aVertexPosition, sphereMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(aVertexPosition)

            spherePositions.forEach(element => {
                let model = glm.mat4.create()
                glm.mat4.translate(model, model, glm.vec3.fromValues(...element))
                glm.mat4.scale(model, model, glm.vec3.fromValues(scale, scale, scale))
                singleColorShader.setMat4('model', model)

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereMesh.indexBuffer)
                gl.drawElements(gl.TRIANGLES, sphereMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0)
            })
        }

        gl.stencilMask(0xFF)
        gl.enable(gl.DEPTH_TEST)


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
        if(currentlyPressedKeys['Shift']){
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