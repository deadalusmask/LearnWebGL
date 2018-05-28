import * as glm from 'gl-matrix'
import * as OBJ from 'webgl-obj-loader'

import Camera from './../../camera'
import Shader from './../../shader'

import gVsSource from './geo.vs'
import gFsSource from './geo.fs'
import fbVsSource from './fb.vs'
import fbFsSource from './fb.fs'
import lightingPassVsSrc from './deferred_shading.vs'
import lightingPassFsSrc from './deferred_shading.fs'

import lampVsSrc from './lamp.vs'
import lampFsSrc from './lamp.fs'

import anvilObj from './../../assets/anvil.obj'
import normal from './../../assets/normal.png'

import sphereObj from './../../assets/sphere.obj'

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


    let gl = canvas.getContext('webgl2', { antialias: false })
    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser or machine may not support it.')
        return
    }


    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    // gl.enable(gl.CULL_FACE)

    let shader = new Shader(gl, gVsSource, gFsSource)
    let fbShader = new Shader(gl, fbVsSource, fbFsSource)
    let lightingPassShader = new Shader(gl, lightingPassVsSrc, lightingPassFsSrc)
    let lampShader = new Shader(gl, lampVsSrc, lampFsSrc)

    let pointLightLocations = [
        1.0, 0.2, 4.0,
        4, 0, 0.0,
        2.0, 5.0, -2.0,
        -2.0, 0.0, -2.0,
        -2.0, 5.0, 5.0
    ]
    let pointLightColors = [
        0.5, 0, 1,
        0, 1, 0,
        0, 0.5, 1,
        1, 1, 0,
        1, 1, 1

    ]
    let quadVertices = [
        // positions     // texture Coords
        -1.0,  1.0, 0.0, 0.0, 1.0,
        -1.0, -1.0, 0.0, 0.0, 0.0,
        1.0,  1.0, 0.0, 1.0, 1.0,
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


    let gBuffer = gl.createFramebuffer()
    gBuffer.width = gl.canvas.clientWidth
    gBuffer.height = gl.canvas.clientHeight
    gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer)

    let gBufferTexture = []
    for(let i=0;i<3;i++){
        gBufferTexture[i] = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, gBufferTexture[i])
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gBuffer.width, gBuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, gBufferTexture[i], 0)
    }

    let attachments = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]
    gl.drawBuffers(attachments)

    let renderbuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gBuffer.width, gBuffer.height)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer)

    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE){
        console.error('framebuffer not complete')
    }


    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    // 1

    shader.use()
    shader.setInt('normalMap', 0)
    shader.setFloat('material.shininess', 1.0)
    shader.setVec3('material.diffuseColor', [0.69,0.75,0.77])

    lightingPassShader.use()
    lightingPassShader.setInt('gPosition', 0)
    lightingPassShader.setInt('gNormal', 1)
    lightingPassShader.setInt('gAlbedoSpec', 2)

    for(let i=0;i<5;i++){
        lightingPassShader.setVec3('lights['+i+'].position', pointLightLocations.slice(i*3,i*3+3))
        lightingPassShader.setVec3('lights['+i+'].color', pointLightColors.slice(i*3,i*3+3))
        lightingPassShader.setFloat('lights['+i+'].linear', 0.09)
        lightingPassShader.setFloat('lights['+i+'].quadratic', 0.032)
    }

    animate()

    function drawScene(timeStamp) {
        gl.clearColor(0, 0, 0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        let view = camera.getViewMatrix()
        let projection = glm.mat4.create()
        glm.mat4.perspective(projection, glm.glMatrix.toRadian(camera.zoom), gl.canvas.clientWidth/gl.canvas.clientHeight, 0.1, 100)

        shader.use()
        shader.setMat4('u_view', view)
        shader.setMat4('u_projection', projection)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, normalmap)

        gl.bindVertexArray(anvilMesh.vao)

        let model = glm.mat4.create()
        glm.mat4.translate(model, model, [0,-1,0])
        // glm.mat4.rotate(model, model, 180, [1,0,0])
        shader.setMat4('u_model', model)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, anvilMesh.indexBuffer)
        gl.drawElements(gl.TRIANGLES, anvilMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0)
        gl.bindVertexArray(null)

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        // // g buffer test
        // {
        //     fbShader.use()
        //     gl.activeTexture(gl.TEXTURE0)
        //     gl.bindTexture(gl.TEXTURE_2D, gBufferTexture[1])

        //     gl.bindVertexArray(quadVAO)
        //     gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        //     gl.bindVertexArray(null)
        // }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        lightingPassShader.use()
        for(let i=0;i<3;i++){
            gl.activeTexture(gl.TEXTURE0+i)
            gl.bindTexture(gl.TEXTURE_2D, gBufferTexture[i])
        }

        lightingPassShader.setVec3('u_viewPos', camera.position)

        gl.bindVertexArray(quadVAO)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        gl.bindVertexArray(null)

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, gBuffer)
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null)
        gl.blitFramebuffer(0, 0, gBuffer.width, gBuffer.height, 0, 0, gBuffer.width, gBuffer.height, gl.DEPTH_BUFFER_BIT, gl.NEAREST)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        // draw lamps
        {
            lampShader.use()
            lampShader.setMat4('u_view', view)
            lampShader.setMat4('u_projection', projection)
            gl.bindVertexArray(sphereMesh.vao)
            let model = glm.mat4.create()
            glm.mat4.scale(model, model, [0.2,0.2,0.2])
            lampShader.setMat4('u_model', model)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereMesh.indexBuffer)
            gl.drawElementsInstanced(gl.TRIANGLES, sphereMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0, 5)
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