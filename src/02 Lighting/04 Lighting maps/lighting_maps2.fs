precision mediump float;

struct Material {
    sampler2D diffuse;
    sampler2D specular;
    float shininess;
};

struct Light {
    vec3 position;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};


uniform vec3 viewPos;
uniform Material material;
uniform Light light;

varying vec3 vFragPos;
varying vec3 vNormal;
varying vec2 vTexCoord;

void main()
{
    // ambient
    vec3 ambient = light.ambient * texture2D(material.diffuse, vTexCoord).rgb;

    // diffuse
    vec3 norm = normalize(vNormal);
    vec3 lightDir = normalize(light.position - vFragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = light.diffuse * diff * texture2D(material.diffuse, vTexCoord).rgb;

    // specular
    vec3 viewDir = normalize(viewPos - vFragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    vec3 specular = light.specular * spec * texture2D(material.specular, vTexCoord).rgb;

    vec3 result = ambient + diffuse + specular;
    gl_FragColor = vec4(result, 1.0);
}



