#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_texCoord;
in vec3 a_tangent;
in vec3 a_bitangent;

out vec3 FragPos;
out vec2 TexCoords;
out mat3 TBN;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_model;


void main()
{
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
    FragPos = vec3(u_model * vec4(a_position, 1.0));
    TexCoords = a_texCoord;

    mat3 normalMatrix = transpose(inverse(mat3(u_model)));
    vec3 T = normalize(normalMatrix * a_tangent);
    vec3 B = normalize(normalMatrix * a_bitangent);
    vec3 N = normalize(normalMatrix * a_normal);

    TBN = transpose(mat3(T, B, N));
}