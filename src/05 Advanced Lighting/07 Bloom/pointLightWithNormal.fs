#version 300 es

precision mediump float;

struct PointLight {
    vec3 position;

    float constant;
    float linear;
    float quadratic;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct Material {
    vec3 diffuseColor;
    float shininess;
};

#define NR_POINT_LIGHTS 4

in vec3 FragPos;
in vec2 TexCoords;
in mat3 TBN;

layout (location = 0) out vec4 FragColor;
layout (location = 1) out vec4 BrightColor;


uniform Material material;
uniform PointLight pointLights[NR_POINT_LIGHTS];
uniform vec3 u_viewPos;
uniform sampler2D normalMap;

vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewPos);

void main() {

    vec3 normal = texture(normalMap, TexCoords).rgb;
    normal = normalize(normal * 2.0 - 1.0);

    vec3 result = vec3(0.0);
    for(int i = 0; i < NR_POINT_LIGHTS; i++)
        result += CalcPointLight(pointLights[i], normal, FragPos, u_viewPos);

    FragColor = vec4(result, 1.0);

    float brightness = dot(FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    if(brightness > 1.0)
        BrightColor = vec4(FragColor.rgb, 1.0);
    else
        BrightColor = vec4(0.0, 0.0, 0.0, 1.0);
}

// calculates the color when using a point light.
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewPos)
{
    vec3 viewDir = normalize(TBN * viewPos - TBN * fragPos);
    vec3 lightDir = normalize(TBN * light.position - TBN * fragPos);
    // diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);

    // specular shading
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    // attenuation
    float distance = length(TBN * light.position - TBN * fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
    // combine results
    vec3 ambient = light.ambient * material.diffuseColor;
    vec3 diffuse = light.diffuse * diff * material.diffuseColor;
    vec3 specular = light.specular * spec * material.diffuseColor;
    ambient *= attenuation;
    diffuse *= attenuation;
    specular *= attenuation;
    return (ambient + diffuse + specular);
}
