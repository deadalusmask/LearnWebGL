#version 300 es

in vec3 a_position;
in vec2 a_texCoord;
in vec3 a_normal;

in vec3 a_tran;
in vec3 a_color;

out vec3 FragPos;
out vec3 Normal;
out vec2 TexCoords;
out vec3 color;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;


void main() {

    color = a_color;

    FragPos = vec3(u_model * vec4(a_position, 1.0));
    Normal = mat3(transpose(inverse(u_model))) * a_normal;
    TexCoords = a_texCoord;

    gl_Position =  u_projection * u_view * vec4(a_position + a_tran, 1.0);
}
