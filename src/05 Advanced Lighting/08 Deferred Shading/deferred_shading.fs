#version 300 es

precision mediump float;

out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gAlbedoSpec;

struct Light {
    vec3 position;
    vec3 color;
    float linear;
    float quadratic;
};

const int NR_LIGHTS = 5;
uniform Light lights[NR_LIGHTS];
uniform vec3 u_viewPos;

void main()
{
    // retrieve data from gbuffer
    vec3 FragPos = texture(gPosition, TexCoords).rgb;
    vec3 Normal = normalize(texture(gNormal, TexCoords).rgb * 2.0 - 1.0);
    vec3 Diffuse = texture(gAlbedoSpec, TexCoords).rgb;
    float Specular = texture(gAlbedoSpec, TexCoords).a;

    // then calculate lighting as usual
    vec3 lighting  = Diffuse * 0.1; // hard-coded ambient component
    vec3 viewDir  = normalize(u_viewPos - FragPos);
    for(int i = 0; i < NR_LIGHTS; ++i)
    {
        // diffuse
        vec3 lightDir = normalize(lights[i].position - FragPos);
        vec3 diffuse = max(dot(Normal, lightDir), 0.0) * Diffuse * lights[i].color;
        // specular
        // vec3 halfwayDir = normalize(lightDir + viewDir);
        // float spec = pow(max(dot(Normal, halfwayDir), 0.0), 16.0);
        // vec3 specular = lights[i].color * spec * Specular;

        vec3 reflectDir = reflect(-lightDir, Normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
        vec3 specular = lights[i].color * spec * Diffuse;

        // attenuation
        float distance = length(lights[i].position - FragPos);
        float attenuation = 1.0 / (1.0 + lights[i].linear * distance + lights[i].quadratic * distance * distance);
        diffuse *= attenuation;
        specular *= attenuation;
        lighting += diffuse + specular;
    }

    const float gamma = 2.2;
    vec3 result = pow(lighting, vec3(1.0 / gamma));
    FragColor = vec4(result, 1.0);
}

// vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewPos)
// {
//     vec3 viewDir = normalize(TBN * viewPos - TBN * fragPos);
//     vec3 lightDir = normalize(TBN * light.position - TBN * fragPos);
//     // diffuse shading
//     float diff = max(dot(normal, lightDir), 0.0);

//     // specular shading
//     vec3 reflectDir = reflect(-lightDir, normal);
//     float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
//     // attenuation
//     float distance = length(TBN * light.position - TBN * fragPos);
//     float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
//     // combine results
//     vec3 ambient = light.ambient * material.diffuseColor;
//     vec3 diffuse = light.diffuse * diff * material.diffuseColor;
//     vec3 specular = light.specular * spec * material.diffuseColor;
//     ambient *= attenuation;
//     diffuse *= attenuation;
//     specular *= attenuation;
//     return (ambient + diffuse + specular);
// }