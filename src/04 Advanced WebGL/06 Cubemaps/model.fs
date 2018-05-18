precision mediump float;

varying vec3 vFragPos;
varying vec3 vNormal;
varying vec2 vTexCoord;

uniform vec3 viewPos;
uniform samplerCube skybox;

void main()
{
    // Reflection
    // vec3 I = normalize(vFragPos - viewPos);
    // vec3 R = reflect(I, normalize(vNormal));

    // gl_FragColor = vec4(textureCube(skybox, R).rgb, 1.0);

    // Refraction
    float ratio = 1.00 / 1.52;
    vec3 I = normalize(vFragPos - viewPos);
    vec3 R = refract(I, normalize(vNormal), ratio);
    gl_FragColor = vec4(textureCube(skybox, R).rgb, 1.0);

}