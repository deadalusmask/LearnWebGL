import * as glm from 'gl-matrix'
import * as OBJ from 'webgl-obj-loader'

import Camera from './../../camera'
import Shader from './../../shader'

import vsSource from './pbr.vs'
import fsSource from './pbr.fs'

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


    let gl = canvas.getContext('webgl2')
    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser or machine may not support it.')
        return
    }


    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    // gl.enable(gl.CULL_FACE)

    let shader = new Shader(gl, vsSource, fsSource)

    let lightPositions = [
        -10.0,  10.0, 10.0,
         10.0,  10.0, 10.0,
        -10.0, -10.0, 10.0,
         10.0, -10.0, 10.0,
    ]
    let lightColors = [
        300.0, 300.0, 300.0,
        300.0, 300.0, 300.0,
        300.0, 300.0, 300.0,
        300.0, 300.0, 300.0
    ]


    let sphereMesh = new OBJ.Mesh(sphereObj)
    sphereMesh.calculateTangentsAndBitangents()
    OBJ.initMeshBuffers(gl, sphereMesh)

    // Init anvil
    {
        sphereMesh.a_position = gl.getAttribLocation(shader.Program, 'a_position')
        sphereMesh.a_texCoord = gl.getAttribLocation(shader.Program, 'a_texCoord')
        sphereMesh.a_normal = gl.getAttribLocation(shader.Program, 'a_normal')

        sphereMesh.a_tangent = gl.getAttribLocation(shader.Program, 'a_tangent')
        sphereMesh.a_bitangent = gl.getAttribLocation(shader.Program, 'a_bitangent')

        sphereMesh.vao = gl.createVertexArray()
        gl.bindVertexArray(sphereMesh.vao)

        gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.vertexBuffer)
        gl.vertexAttribPointer(sphereMesh.a_position, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(sphereMesh.a_position)
        gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.textureBuffer)
        gl.vertexAttribPointer(sphereMesh.a_texCoord, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(sphereMesh.a_texCoord)
        gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.normalBuffer)
        gl.vertexAttribPointer(sphereMesh.a_normal, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(sphereMesh.a_normal)

        gl.bindVertexArray(null)
    }


    let nrRows = 7
    let nrColumns = 7
    let spacing = 2.5

    shader.use()
    shader.setVec3('albedo', [0.5, 0.0, 0.0])
    shader.setFloat('ao', 1.0)

    let projection = glm.mat4.create()
    glm.mat4.perspective(projection, glm.glMatrix.toRadian(camera.zoom), gl.canvas.clientWidth/gl.canvas.clientHeight, 0.1, 100)
    shader.setMat4('u_projection', projection)


    animate()

    function drawScene(timeStamp) {
        gl.clearColor(0, 0, 0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        let view = camera.getViewMatrix()

        shader.use()
        shader.setMat4('u_view', view)
        shader.setVec3('camPos', camera.position)

        gl.bindVertexArray(sphereMesh.vao)
        for(let row=0;row<nrRows;++row){
            shader.setFloat('metallic', row/nrRows)
            for(let col=0;col<nrColumns;++col){
                shader.setFloat('roughness', Math.min(Math.max(col/nrColumns, 0.05), 1.0))

                let model = glm.mat4.create()
                glm.mat4.translate(model, model, [
                    (col-(nrColumns/2)) * spacing,
                    (row-(nrRows/2)) * spacing,
                    0
                ])
                shader.setMat4('u_model', model)
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereMesh.indexBuffer)
                gl.drawElements(gl.TRIANGLES, sphereMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0)
            }
        }
        gl.bindVertexArray(null)


        // gl.activeTexture(gl.TEXTURE0)
        // gl.bindTexture(gl.TEXTURE_2D, normalmap)

        gl.bindVertexArray(sphereMesh.vao)
        for(let i=0;i<lightPositions.length;++i){
            let newPos = lightPositions.slice(i*3,i*3+3)
            //glm.vec3.add(newPos, lightPositions.slice(i*3,i*3+3), [5, 0, 0])
            shader.setVec3('lightPositions['+i+']', newPos)
            shader.setVec3('lightColors['+i+']', lightColors.slice(i*3,i*3+3))
            let model = glm.mat4.create()
            glm.mat4.translate(model, model, newPos)
            glm.mat4.scale(model, model, 0.1)
            shader.setMat4('u_model', model)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereMesh.indexBuffer)
            gl.drawElements(gl.TRIANGLES, sphereMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0)
        }
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