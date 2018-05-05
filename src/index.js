import Shader from './shader'
import vsSource from './01 Get Started/03 Textures/texture.vs'
import fsSource from './01 Get Started/03 Textures/texture.fs'

import wall from './assets/wall.jpg'
import Avatar from './assets/Avatar.png'

async function init(){
    document.body.style.margin = 0
    document.body.style.overflow = 'hidden'
    let canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    // window.onresize = function(){
    //     canvas.width = window.innerWidth
    //     canvas.height = window.innerHeight
    //     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    //     drawScene()
    // }
    document.body.appendChild(canvas)

    let gl = canvas.getContext('webgl')
    if (!gl) {
        console.error("Unable to initialize WebGL. Your browser or machine may not support it.")
        return
    }

    let shader = new Shader(gl, vsSource, fsSource)
    shader.use()

    let vertices = [
        // positions       // texture coords
         0.5,  0.5, 0.0,   1.0, 1.0, // top right
         0.5, -0.5, 0.0,   1.0, 0.0, // bottom right
        -0.5, -0.5, 0.0,   0.0, 0.0, // bottom left
        -0.5,  0.5, 0.0,   0.0, 1.0  // top left
    ]
    let indices = [
        0, 1, 3, // first triangle
        1, 2, 3  // second triangle
    ]

    let VBO = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

    let EBO = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW)

    let aVertexPosition = gl.getAttribLocation(shader.Program, 'aPos')
    gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, true, 20, 0)
    gl.enableVertexAttribArray(aVertexPosition)

    let aTexCoord = gl.getAttribLocation(shader.Program, 'aTexCoord')
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, true, 20, 12)
    gl.enableVertexAttribArray(aTexCoord)

    let wallImage = await loadImage(wall)
    let texture1 = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture1)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, wallImage)
    gl.generateMipmap(gl.TEXTURE_2D)

    let AvatarImage = await loadImage(Avatar)
    let texture2 = gl.createTexture()
    gl.activeTexture(gl.TEXTURE1)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
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
        shader.use()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO)
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0)

    }

    function animate() {
        //processInput(window)
        drawScene()
        requestAnimationFrame(animate)
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