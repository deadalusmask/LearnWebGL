attribute vec3 aPos;
attribute vec2 aTexCoord;

uniform mat4 uTransform;

varying vec2 TexCoord;

void main() {
    TexCoord = aTexCoord;
    gl_Position = uTransform * vec4(aPos, 1.0);
}