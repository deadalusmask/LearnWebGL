export default class Shader {
    constructor(gl, vsSource, fsSource){
        let vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
        let fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

        // 创建着色器程序
        let shaderProgram = gl.createProgram()
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

        this.gl = gl
        this.Program = shaderProgram
    }

    use() {
        this.gl.useProgram(this.Program)
    }

    setBool(name,value) {
        this.gl.uniform1i(this.gl.getUniformLocation(this.Program, name), Number(value))
    }
    setInt(name,value) {
        this.gl.uniform1i(this.gl.getUniformLocation(this.Program, name), Number(value))
    }
    setFloat(name,value) {
        this.gl.uniform1f(this.gl.getUniformLocation(this.Program, name), Number(value))
    }
    setVec3(name,x,y,z) {
        this.gl.uniform3f(this.gl.getUniformLocation(this.Program, name), Number(x), Number(y), Number(z))
    }
    setVec4(name,x,y,z,w) {
        this.gl.uniform4f(this.gl.getUniformLocation(this.Program, name), Number(x), Number(y), Number(z), Number(w))
    }
    setMat3(name, mat3) {
        this.gl.uniformMatrix3fv(this.gl.getUniformLocation(this.Program, name), false, mat3)
    }
    setMat4(name, mat4) {
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.Program, name), false, mat4)
    }
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