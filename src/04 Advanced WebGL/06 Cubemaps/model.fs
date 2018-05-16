precision mediump float;

// varying vec3 vFragPos;
// varying vec3 vNormal;
varying vec2 vTexCoord;

uniform sampler2D texture1;

void main()
{
    gl_FragColor =  texture2D(texture1, vTexCoord);
}
