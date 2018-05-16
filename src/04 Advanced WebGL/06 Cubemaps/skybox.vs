
attribute vec3 aPos;

uniform mat4 view;
uniform mat4 projection;

varying vec3 vTexCoord;

void main()
{
    vTexCoord = aPos;
    vec4 pos = projection * view * vec4(aPos, 1.0);
    gl_Position = pos.xyww;
}
