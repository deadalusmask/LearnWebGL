precision mediump float;

uniform float uAlpha;
varying vec3 vColor;

void main() {

    gl_FragColor = vec4(vColor, uAlpha);
}