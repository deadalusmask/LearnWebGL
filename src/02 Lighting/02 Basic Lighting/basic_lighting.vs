
attribute vec3 aPos;
attribute vec3 aNormal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalMatrix;

varying vec3 vFragPos;
varying vec3 vNormal;

void main()
{
    vFragPos = vec3(model * vec4(aPos, 1.0));
    vNormal = normalMatrix * aNormal;

    gl_Position = projection * view * model * vec4(aPos, 1.0);
}