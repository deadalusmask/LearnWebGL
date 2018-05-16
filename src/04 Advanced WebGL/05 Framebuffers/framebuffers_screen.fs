precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D screenTexture;

void main()
{
	// gl_FragColor = vec4(vec3(1.0 - texture2D(screenTexture, vTexCoord)), 1.0);
    gl_FragColor =  texture2D(screenTexture, vTexCoord);
}
