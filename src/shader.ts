import * as THREE from 'three';

function glsl(strings: TemplateStringsArray, ...values: any[]): string {
	return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
}

const vertexShader = glsl`
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
	vec4 worldPos = modelMatrix * vec4(position, 1.0);
	vWorldPosition = worldPos.xyz;
	vWorldNormal = normalize(normalMatrix * normal);
	gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const fragmentShader = glsl`
uniform vec3 color;
uniform vec3 ambientColor;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
	vec3 lightDir = normalize(vec3(-0.4, -1.0, -0.6));
	vec3 viewDir = normalize(cameraPosition - vWorldPosition);
	vec3 lightColor = vec3(1.0);

	vec3 normal = normalize(vWorldNormal);

	float alignment = max(dot(normal, -lightDir), 0.0);
	vec3 diffuse = alignment * lightColor;

	float specularStrength = 64.0;
	vec3 halfDir = normalize(viewDir - lightDir);
	float specAngle = max(dot(normal, halfDir), 0.0);
	float specularity = pow(specAngle, specularStrength) * alignment;
	vec3 specular = specularity * lightColor;

	float ambientStrength = 0.9;
	vec3 ambient = ambientColor * ambientStrength;

	vec3 lighting = ambient + diffuse + specular;
	gl_FragColor = vec4(color * lighting, 1.0);
}
`;

export function createMaterial(
	color: THREE.ColorRepresentation,
): THREE.ShaderMaterial {
	return new THREE.ShaderMaterial({
		uniforms: {
			color: { value: color },
			ambientColor: { value: new THREE.Color(0xbbbbbb) },
		},
		vertexShader,
		fragmentShader,
	});
}
