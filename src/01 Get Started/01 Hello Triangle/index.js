const vsSource = `
attribute vec3 aPos;

void main() {
    gl_Position = vec4(aPos, 1.0);
}
`

const fsSource = `
void main() {
    gl_FragColor = vec4(0.5, 0.0, 1.0, 1.0);
}
`

function init(){
    document.body.style.margin = 0
    document.body.style.overflow = 'hidden'
    canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    document.body.appendChild(canvas)

    gl = canvas.getContext('webgl')
    if (!gl) {
        console.error("Unable to initialize WebGL. Your browser or machine may not support it.")
        return
    }

    shaderProgram = initShaderProgram(gl, vsSource, fsSource)

    let vertices = [
        0.5,  0.5, 0.0,  // top right
        0.5, -0.5, 0.0,  // bottom right
       -0.5, -0.5, 0.0,  // bottom left
       -0.5,  0.5, 0.0   // top left
    ]
    let indices = [  // note that we start from 0!
        0, 1, 3,  // first Triangle
        1, 2, 3   // second Triangle
    ]

    let VBO = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

    let EBO = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW)

    let aVertexPosition = gl.getAttribLocation(shaderProgram, 'aPos')
    gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, true, 0, 0)
    gl.enableVertexAttribArray(aVertexPosition)
    animate()

    function drawScene() {
        gl.clearColor(0.0, 0.5, 1.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(shaderProgram)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO)
        //gl.drawArrays(gl.TRIANGLES, 0, 3)
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0)

    }

    function animate() {
        drawScene()
        requestAnimationFrame(animate)
    }

}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

    // 创建着色器程序
    const shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    // 创建失败
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram))
        return null
    }

    return shaderProgram
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type)

    // Send the source to the shader object
    gl.shaderSource(shader, source)

    // Compile the shader program
    gl.compileShader(shader)

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }

    return shader
}

init()