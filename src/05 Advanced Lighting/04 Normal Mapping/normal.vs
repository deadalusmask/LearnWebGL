#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_texCoord;
in vec3 a_tangent;
in vec3 a_bitangent;

out vec3 FragPos;
out vec2 TexCoords;
out vec3 TangentLightPos;
out vec3 TangentViewPos;
out vec3 TangentFragPos;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_model;

uniform vec3 lightPos;
uniform vec3 viewPos;

void main()
{
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
    FragPos = vec3(u_model * vec4(a_position, 1.0));
    TexCoords = a_texCoord;

    mat3 normalMatrix = transpose(inverse(mat3(u_model)));
    vec3 T = normalize(normalMatrix * a_tangent);
    vec3 B = normalize(normalMatrix * a_bitangent);
    vec3 N = normalize(normalMatrix * a_normal);

    mat3 TBN = transpose(mat3(T, B, N));
    TangentLightPos = TBN * lightPos;
    TangentViewPos  = TBN * viewPos;
    TangentFragPos  = TBN * FragPos;
}