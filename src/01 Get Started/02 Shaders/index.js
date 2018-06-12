import Shader from './shader'
import vsSource from './shader.vs'
import fsSource from './shader.fs'

function init() {
  document.body.style.margin = 0
  document.body.style.overflow = 'hidden'
  let canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  let gl = canvas.getContext('webgl')
  if (!gl) {
    console.error("Unable to initialize WebGL. Your browser or machine may not support it.")
    return
  }

  let shader = new Shader(gl, vsSource, fsSource)

  let vertices = [
    // 位置            // 颜色
    0.5, -0.5, 0.0, 1.0, 0.0, 0.0,   // 右下
    -0.5, -0.5, 0.0, 0.0, 1.0, 0.0,   // 左下
    0.0, 0.5, 0.0, 0.0, 0.0, 1.0    // 顶部
  ]

  let VBO = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, VBO)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  let aVertexPosition = gl.getAttribLocation(shader.Program, 'aPos')
  gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, true, 24, 0)
  gl.enableVertexAttribArray(aVertexPosition)

  let aColorPosition = gl.getAttribLocation(shader.Program, 'aColor')
  gl.vertexAttribPointer(aColorPosition, 3, gl.FLOAT, true, 24, 12)
  gl.enableVertexAttribArray(aColorPosition)

  animate()

  function drawScene() {
    gl.clearColor(0.0, 0.5, 1.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    shader.use()
    shader.setFloat('uAlpha', (Math.sin(Date.now() * 0.001) + 1) / 2)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function animate() {
    drawScene()
    requestAnimationFrame(animate)
  }

}

init()
