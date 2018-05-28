#version 300 es

precision mediump float;

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D scene;

void main()
{
    FragColor = texture(scene, TexCoords);
}