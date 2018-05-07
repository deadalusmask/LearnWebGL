import * as glm from 'gl-matrix';

import Shader from './shader'
import vsSource from '../05 Coordinate Systems/coordinate_systems.vs'
import fsSource from '../05 Coordinate Systems/coordinate_systems.fs'

import wall from './../../assets/wall.jpg'
import Avatar from './../../assets/Avatar.png'

async function init(){

    let cameraPos = glm.vec3.fromValues(0.0, 0.0, 3.0)
    let cameraFront = glm.vec3.fromValues(0.0, 0.0, -1.0)
    let cameraUp = glm.vec3.fromValues(0.0, 1.0, 0.0)
    let deltaTime = 0.0 // time between current frame and last fram
    let lastFrame = 0.0

    document.body.style.margin = 0
    document.body.style.overflow = 'hidden'
    let canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    window.onresize = function(){
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        drawScene()
    }

    //capture input
    let currentlyPressedKeys = {}
    document.onkeydown = function(event){
        currentlyPressedKeys[event.key] = true
    }
    document.onkeyup = function(event){
        currentlyPressedKeys[event.key] = false;
    }

    document.body.appendChild(canvas)
    let gl = canvas.getContext('webgl')
    if (!gl) {
        console.error("Unable to initialize WebGL. Your browser or machine may not support it.")
        return
    }
    gl.enable(gl.DEPTH_TEST)

    let shader = new Shader(gl, vsSource, fsSource)
    shader.use()

    let vertices = [
        -0.5, -0.5, -0.5,  0.0, 0.0,
         0.5, -0.5, -0.5,  1.0, 0.0,
         0.5,  0.5, -0.5,  1.0, 1.0,
         0.5,  0.5, -0.5,  1.0, 1.0,
        -0.5,  0.5, -0.5,  0.0, 1.0,
        -0.5, -0.5, -0.5,  0.0, 0.0,

        -0.5, -0.5,  0.5,  0.0, 0.0,
         0.5, -0.5,  0.5,  1.0, 0.0,
         0.5,  0.5,  0.5,  1.0, 1.0,
         0.5,  0.5,  0.5,  1.0, 1.0,
        -0.5,  0.5,  0.5,  0.0, 1.0,
        -0.5, -0.5,  0.5,  0.0, 0.0,

        -0.5,  0.5,  0.5,  1.0, 0.0,
        -0.5,  0.5, -0.5,  1.0, 1.0,
        -0.5, -0.5, -0.5,  0.0, 1.0,
        -0.5, -0.5, -0.5,  0.0, 1.0,
        -0.5, -0.5,  0.5,  0.0, 0.0,
        -0.5,  0.5,  0.5,  1.0, 0.0,

         0.5,  0.5,  0.5,  1.0, 0.0,
         0.5,  0.5, -0.5,  1.0, 1.0,
         0.5, -0.5, -0.5,  0.0, 1.0,
         0.5, -0.5, -0.5,  0.0, 1.0,
         0.5, -0.5,  0.5,  0.0, 0.0,
         0.5,  0.5,  0.5,  1.0, 0.0,

        -0.5, -0.5, -0.5,  0.0, 1.0,
         0.5, -0.5, -0.5,  1.0, 1.0,
         0.5, -0.5,  0.5,  1.0, 0.0,
         0.5, -0.5,  0.5,  1.0, 0.0,
        -0.5, -0.5,  0.5,  0.0, 0.0,
        -0.5, -0.5, -0.5,  0.0, 1.0,

        -0.5,  0.5, -0.5,  0.0, 1.0,
         0.5,  0.5, -0.5,  1.0, 1.0,
         0.5,  0.5,  0.5,  1.0, 0.0,
         0.5,  0.5,  0.5,  1.0, 0.0,
        -0.5,  0.5,  0.5,  0.0, 0.0,
        -0.5,  0.5, -0.5,  0.0, 1.0
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

    // pass projection matrix to shader (as projection matrix rarely changes there's no need to do this per frame)
    let projection = glm.mat4.create()
    glm.mat4.perspective(projection, glm.glMatrix.toRadian(45.0), gl.canvas.clientWidth/gl.canvas.clientHeight, 0.1, 100)



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

        shader.setMat4('view', view)
        shader.setMat4('projection', projection)

        cubePositions.forEach((element, index)=>{
            let model = glm.mat4.create()
            glm.mat4.translate(model, model, glm.vec3.fromValues(...element))
            let angle = 20.0 * index
            glm.mat4.rotate(model, model, glm.glMatrix.toRadian(angle+Date.now()*0.03), glm.vec3.fromValues(0.1, 0.3, 0.5))
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
        if(currentlyPressedKeys['w']){
            glm.vec3.scale(temp1, cameraFront, cameraSpeed)
            glm.vec3.add(cameraPos, cameraPos, temp1)
            // cameraPos += cameraSpeed * cameraFront;
        }
        if(currentlyPressedKeys['s']){
            glm.vec3.scale(temp1, cameraFront, cameraSpeed)
            glm.vec3.sub(cameraPos, cameraPos, temp1)
            // cameraPos -= cameraSpeed * cameraFront;
        }
        if(currentlyPressedKeys['a']){
            glm.vec3.cross(temp1, cameraFront, cameraUp)
            glm.vec3.normalize(temp1, temp1)
            glm.vec3.scale(temp1, temp1, cameraSpeed)
            glm.vec3.sub(cameraPos, cameraPos, temp1)
            // cameraPos -= glm::normalize(glm::cross(cameraFront, cameraUp)) * cameraSpeed;
        }
        if(currentlyPressedKeys['d']){
            glm.vec3.cross(temp1, cameraFront, cameraUp)
            glm.vec3.normalize(temp1, temp1)
            glm.vec3.scale(temp1, temp1, cameraSpeed)
            glm.vec3.add(cameraPos, cameraPos, temp1)
            // cameraPos += glm::normalize(glm::cross(cameraFront, cameraUp)) * cameraSpeed;
        }

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