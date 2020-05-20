#version 430

//входные переменные vertex - позиция вершины
in vec3 vertex;
out vec3 interpolated_vertex;

void main(void){
	gl_Position=vec4(vertex,1.0);
	interpolated_vertex=vertex;
}