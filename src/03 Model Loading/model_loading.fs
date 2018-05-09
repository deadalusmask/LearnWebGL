precision mediump float;

struct Material {
    sampler2D diffuse;
    sampler2D specular;
    float shininess;
};

struct DirLight {
    vec3 direction;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

uniform vec3 viewPos;
uniform Material material;
uniform DirLight dirLight;

varying vec3 vFragPos;
varying vec3 vNormal;
varying vec2 vTexCoord;

vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir);

void main()
{
    // properties
    vec3 norm = normalize(vNormal);
    vec3 viewDir = normalize(viewPos - vFragPos);

    vec3 result = CalcDirLight(dirLight, norm, viewDir);

    gl_FragColor = vec4(result, 1.0);

}

// calculates the color when using a directional light.
vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir)
{
    vec3 lightDir = normalize(-light.direction);
    // diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);
    // specular shading
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    // combine results
    vec3 ambient = light.ambient * vec3(texture2D(material.diffuse, vTexCoord));
    vec3 diffuse = light.diffuse * diff * vec3(texture2D(material.diffuse, vTexCoord));
    vec3 specular = light.specular * spec * vec3(0.5);
    return (ambient + diffuse + specular);
}
