import * as glm from 'gl-matrix'
import * as OBJ from 'webgl-obj-loader'

import Camera from './../../camera'
import Shader from './../../shader'

import vsSource from './../../03 Model Loading/model_loading.vs'
import fsSource from './../../03 Model Loading/model_loading.fs'
import alphaTexFsSource from '../03 Blending/alpha_tex.fs'
import framebufferScreenVsSouece from './framebuffers_screen.vs'
import framebufferScreenFsSouece from './framebuffers_screen.fs'


import suzanneObj from './../../assets/suzanne.obj'
import planeObj from './../../assets/plane.obj'
import sphereObj from './../../assets/sphere.obj'

import wood from './../../assets/WoodFineDark004_COL_3K.jpg'
import windowSrc from './../../assets/window.png'
import grassSrc from './../../assets/grass.png'

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
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.CULL_FACE)

    let shader = new Shader(gl, vsSource, fsSource)
    let alphaShader = new Shader(gl, vsSource, alphaTexFsSource)
    let screenShader = new Shader(gl, framebufferScreenVsSouece, framebufferScreenFsSouece)

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
    let windowPositions = [
        [2, 0, 4],
        [3, 0, 0],
        [2, 0, -2]
    ]
    let quadVertices = [ // vertex attributes for a quad that fills the entire screen in Normalized Device Coordinates.
        // positions   // texCoords
        -1.0,  1.0,  0.0, 1.0,
        -1.0, -1.0,  0.0, 0.0,
         1.0, -1.0,  1.0, 0.0,

        -1.0,  1.0,  0.0, 1.0,
         1.0, -1.0,  1.0, 0.0,
         1.0,  1.0,  1.0, 1.0
    ]

    let quadVBO = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVertices), gl.STATIC_DRAW)

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    let woodImg = await loadImage(wood)
    let diffuse = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, diffuse)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, woodImg)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    let windowImg = await loadImage(windowSrc)
    let windowTex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, windowTex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, windowImg)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    shader.use()
    shader.setInt('material.diffuse', 0)

    alphaShader.use()
    alphaShader.setInt('texture1', 0)

    screenShader.use()
    screenShader.setInt('screenTexture', 0)

    // framebuffer configuration
    let framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    framebuffer.width = gl.canvas.clientWidth
    framebuffer.height = gl.canvas.clientHeight

    // create a color attachment texture
    let textureColorbuffer = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, textureColorbuffer)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, framebuffer.width, framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)



    let renderbuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, framebuffer.width, framebuffer.height)

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureColorbuffer, 0)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer)


    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)


    animate()

    function drawScene(timeStamp) {

        // bind to framebuffer and draw scene as we normally would to color texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
        gl.enable(gl.DEPTH_TEST) // enable depth testing (is disabled for rendering screen-space quad)

        gl.clearColor(0.1, 0.1, 0.1, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        let view = camera.getViewMatrix()
        let projection = glm.mat4.create()
        glm.mat4.perspective(projection, glm.glMatrix.toRadian(camera.zoom), gl.canvas.clientWidth/gl.canvas.clientHeight, 0.1, 100)

        shader.use()
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, diffuse)

        shader.setVec3('viewPos', camera.position)
        shader.setMat4('view', view)
        shader.setMat4('projection', projection)

        // light properties
        shader.setVec3('dirLight.direction', glm.vec3.fromValues(-0.2, -1.0, -0.3))
        shader.setVec3('dirLight.ambient', glm.vec3.fromValues(0.3, 0.3, 0.4))
        shader.setVec3('dirLight.diffuse', glm.vec3.fromValues(0.5, 0.5, 0.5))
        shader.setVec3('dirLight.specular', glm.vec3.fromValues(0.5, 0.5, 0.5))

        // material properties
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, diffuse)
        shader.setFloat('material.shininess', 16.0)


        // draw plane
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

        // draw monkey
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

        // draw sphere
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

        // draw window
        if(planeMesh) {

            alphaShader.use()
            alphaShader.setVec3('viewPos', camera.position)
            alphaShader.setMat4('view', view)
            alphaShader.setMat4('projection', projection)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, windowTex)
            alphaShader.setInt('texture1', 0)

            let aVertexPosition =  gl.getAttribLocation(alphaShader.Program, 'aPos')
            gl.bindBuffer(gl.ARRAY_BUFFER, planeMesh.vertexBuffer)
            gl.vertexAttribPointer(aVertexPosition, planeMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(aVertexPosition)

            if(planeMesh.textures.length){
                let aTexCoord = gl.getAttribLocation(alphaShader.Program, 'aTexCoord')
                gl.bindBuffer(gl.ARRAY_BUFFER, planeMesh.textureBuffer)
                gl.vertexAttribPointer(aTexCoord, planeMesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0)
                gl.enableVertexAttribArray(aTexCoord)
            }

            let aNormal = gl.getAttribLocation(alphaShader.Program, 'aNormal')
            gl.bindBuffer(gl.ARRAY_BUFFER, planeMesh.normalBuffer)
            gl.vertexAttribPointer(aNormal, planeMesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(aNormal)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, planeMesh.indexBuffer)


            windowPositions.sort((a, b)=>{
                let distanceA = glm.vec3.distance(camera.position, glm.vec3.fromValues(...a))
                let distanceB = glm.vec3.distance(camera.position, glm.vec3.fromValues(...b))
                return distanceB - distanceA
            })
            windowPositions.forEach((element)=>{
                let model = glm.mat4.create()
                glm.mat4.translate(model, model, glm.vec3.fromValues(...element))
                glm.mat4.rotate(model, model, glm.glMatrix.toRadian(90), glm.vec3.fromValues(1.0, 0.0, 0.0))
                glm.mat4.scale(model, model, glm.vec3.fromValues(0.5, 0.5, 0.5))
                alphaShader.setMat4('model', model)

                let normalMatrix = glm.mat3.create()
                glm.mat3.fromMat4(normalMatrix, model)
                glm.mat3.invert(normalMatrix, normalMatrix)
                glm.mat3.transpose(normalMatrix, normalMatrix)
                alphaShader.setMat3('normalMatrix', normalMatrix)

                gl.drawElements(gl.TRIANGLES, planeMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0)
            })


        }

        // now bind back to default framebuffer and draw a quad plane with the attached framebuffer color texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.disable(gl.DEPTH_TEST)
        gl.clearColor(1, 1, 1, 1)   // clear to white
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)


        screenShader.use()
        let aVertexPosition =  gl.getAttribLocation(screenShader.Program, 'aPos')
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO)
        gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 16, 0)
        gl.enableVertexAttribArray(aVertexPosition)
        let aTexCoord =  gl.getAttribLocation(screenShader.Program, 'aTexCoord')
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO)
        gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 16, 8)
        gl.enableVertexAttribArray(aTexCoord)
        gl.bindTexture(gl.TEXTURE_2D, textureColorbuffer)	// use the color attachment texture as the texture of the quad plane
        gl.drawArrays(gl.TRIANGLES, 0, 6)

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