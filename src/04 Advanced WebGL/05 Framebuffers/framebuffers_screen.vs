
attribute vec3 aPos;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main()
{
    vTexCoord = aTexCoord;
    gl_Position = vec4(aPos.x, aPos.y, 0.0, 1.0);
}