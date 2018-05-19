#version 300 es

precision mediump float;

out vec4 FragColor;

in vec2 TexCoords;
in vec3 color;

uniform sampler2D diffuse;

void main() {
    FragColor = mix(texture(diffuse, TexCoords), vec4(color, 1), 0.2);
    //FragColor = vec4(color, 1);
}