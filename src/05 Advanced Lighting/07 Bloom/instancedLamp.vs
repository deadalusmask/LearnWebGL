#version 300 es

in vec3 a_position;
in vec3 a_location;
in vec3 a_color;

out vec3 color;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

void main() {
    color = a_color;
    gl_Position =  u_projection * u_view * (u_model * vec4(a_position, 1.0) + vec4(a_location, 1.0) );
}
