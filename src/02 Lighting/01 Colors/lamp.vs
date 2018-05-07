attribute vec3 aPos;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

varying vec2 TexCoord;

void main()
{
    gl_Position = projection * view * model * vec4(aPos, 1.0);
}