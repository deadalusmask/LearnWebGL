#version 300 es

precision mediump float;

struct Material {
    vec3 diffuseColor;
    float shininess;
};

in vec3 FragPos;
in vec2 TexCoords;
in mat3 TBN;

layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedoSpec;

uniform Material material;
uniform sampler2D normalMap;

void main() {
    vec3 normal = texture(normalMap, TexCoords).rgb;
    normal = normal * 2.0 - 1.0;
    normal = normalize(normal * TBN);
    normal = normal + 1.0 / 2.0;

    gPosition = vec4(FragPos, 1.0);
    gNormal = vec4(normal, 1.0);

    gAlbedoSpec.rgb = material.diffuseColor;
    gAlbedoSpec.a = material.shininess;
}
