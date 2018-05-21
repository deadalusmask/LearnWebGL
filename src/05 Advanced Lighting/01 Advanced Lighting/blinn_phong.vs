#version 300 es

layout (location = 0) in vec3 a_position;
layout (location = 1) in vec2 a_texCoord;
layout (location = 2) in vec3 a_normal;

out vec3 FragPos;
out vec3 Normal;
out vec2 TexCoords;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

void main() {

    FragPos = vec3(u_model * vec4(a_position, 1.0));
    Normal = mat3(transpose(inverse(u_model))) * a_normal;
    TexCoords = a_texCoord;

    gl_Position =  u_projection * u_view * u_model * vec4(a_position, 1.0);
}
