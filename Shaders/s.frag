#version 430
#define EPSILON 0.001
#define BIG 1000000.0
//***********************************STRUCTURES***************************************/
struct Camera {
        vec3 pos;
        vec3 view;
        vec3 up;
        vec3 side;
};
struct Ray {
        vec3 origin;
        vec3 direction;
};
struct Sphere{
        vec3 center;
        float radius;
        vec3 color;
        int material_ind;
};
struct Triangle{
        vec3 v1;
        vec3 v2;
        vec3 v3;
        vec3 color;
        int material_ind;
};
struct Material{
        vec4 light_coeffs;
};
struct Intersection{
        float time;
        vec3 point;
        vec3 normal;
        vec3 color;
        vec4 light_coeffs;
        int material_ind;
};
//*****************************IN,OUT,UNIFORM VARIABLES***********************************/

in vec3 interpolated_vertex;
out vec4 FragColor;

uniform Camera camera;
uniform vec2 scale;
uniform vec3 light_pos;

//объявляем буфер
layout(std430, binding=0) buffer SphereBuffer {
        Sphere sphere_data[];
};
Triangle triangle_data[48];

Material material = Material(vec4(0.4,0.9,0.0,512.0));

//**************************************FUNCTIONS****************************************/
Ray GenerateRay(Camera camera){
        vec2 coords = interpolated_vertex.xy * normalize(scale);
        vec3 direction = camera.view + camera.side * coords.x + camera.up * coords.y;
        return Ray(camera.pos, normalize(direction));
}

bool intersect_sphere(Sphere sphere, Ray ray ,out float time){
        ray.origin -=sphere.center;
        float A=dot(ray.direction, ray.direction);
        float B=dot(ray.direction, ray.origin);
        float C=dot(ray.origin, ray.origin)- sphere.radius*sphere.radius;
        float D=B*B-A*C;
        if(D>0.0){
                D=sqrt(D);
                float t1 = ( -B - D ) / A;
                float t2 = ( -B + D ) / A;
                float min_t = min(t1,t2);
                float max_t = max(t1,t2);

                if(max_t < 0) return false;
                if(min_t < 0) {
                        time=max_t;
                        return true;
                }
                time = min_t;
                return true;
        }
        return false;
}
bool intersect_triangle (Ray ray, vec3 v1, vec3 v2, vec3 v3, out float time ){
    time = -1;
    vec3 A = v2 - v1;
    vec3 B = v3 - v1;
    vec3 N = cross(A, B);
    float RayDirection = dot(N, ray.direction);

    if (abs(RayDirection) < EPSILON)   return false;
    float d = dot(N, v1);
    float t = -1.0f * (dot(N, ray.origin) - d) / RayDirection;

    if (t < 0) return false;
    vec3 P = ray.origin + t * ray.direction;

    vec3 C;
    vec3 edge1 = v2 - v1;
    vec3 VP1 = P - v1;
    C = cross(edge1, VP1);
    if (dot(N, C) < 0)  return false;

    vec3 edge2 = v3 - v2;
    vec3 VP2 = P - v2;
    C = cross(edge2, VP2);
    if (dot(N, C) < 0)   return false;

    vec3 edge3 = v1 - v3;
    vec3 VP3 = P - v3;
    C = cross(edge3, VP3);
    if (dot(N, C) < 0)   return false;

    time = t;
    return true;
}
//пересекает луч со всеми примитивами сцены и возвращает ближайшее пересечение
bool Intersect ( Ray ray, float start, float final, inout Intersection intersect ) {
        bool result = false;
        float time = start;
        intersect.time = final;

        for(int i=0; i < sphere_data.length() ;i++){
                if( intersect_sphere (sphere_data[i], ray, time) && time < intersect.time ) {
                        intersect.time = time;
                        intersect.point = ray.origin + ray.direction * time;
                        intersect.normal = normalize ( intersect.point - sphere_data[i].center );
                        intersect.color = sphere_data[i].color;
                        intersect.material_ind = sphere_data[i].material_ind;
                        intersect.light_coeffs = material.light_coeffs;
                        result = true;
                }
        }
        for(int i = 0;i < triangle_data.length();i++){
                if(intersect_triangle(ray, triangle_data[i].v1, triangle_data[i].v2, triangle_data[i].v3, time) && time < intersect.time){
		                intersect.point = ray.origin + ray.direction * time;
                        intersect.normal = normalize(cross(triangle_data[i].v1 - triangle_data[i].v2, triangle_data[i].v3 - triangle_data[i].v2));
                        intersect.color = triangle_data[i].color;
                        intersect.material_ind = triangle_data[i].material_ind;
		                intersect.light_coeffs = material.light_coeffs;
		                intersect.time = time;
		                result = true;
	            }
         }
   return result;
}
//**************************************SHADOWING FUNCTIONS**************************************/
//в тени точка или нет
float Shadow(vec3 pos_light, Intersection intersect){
        float shad = 1.0;
        vec3 direction = normalize(pos_light - intersect.point);
        float dist_light = distance(pos_light, intersect.point);
        vec3 k = direction * EPSILON;
        Ray shad_ray = Ray(intersect.point + k, direction);
        Intersection shad_intersect;
        shad_intersect.time = BIG;
        if(Intersect(shad_ray, 0 ,dist_light, shad_intersect)){
                shad=0.0;
        }
        return shad;
}

vec3 Phong (Intersection intersect, vec3 pos_light, float shadow){
        vec3 light = normalize(pos_light - intersect.point);
        float diffuse = max(dot(light, intersect.normal), 0.0);
        vec3 view = normalize(camera.pos - intersect.point);
        vec3 reflected = reflect(-view, intersect.normal);
        float specular = pow(max(dot(reflected, light), 0.0), intersect.light_coeffs.w);

        return intersect.light_coeffs.x*intersect.color+
                        intersect.light_coeffs.y*diffuse*intersect.color*shadow+
                        intersect.light_coeffs.z*specular;
}

vec4 Raytrace(Ray primary_ray){
        vec4 result_color= vec4(0,0,0,0);
        Ray ray = primary_ray;
        Intersection intersect;
        intersect.time=BIG;
        float start = 0;
        float final = BIG;
        if(Intersect(ray, start, final, intersect)){
                float shad  = Shadow(light_pos, intersect);
                result_color += vec4(Phong(intersect, light_pos, shad), 0);
        }
        return result_color;
}

void main(void){
    triangle_data[0] = Triangle(vec3(4, 0, 2), vec3(2, 0, 2), vec3(4, 2, 2),vec3(0, 0, 1),0);//задняя стенка
    triangle_data[1] = Triangle(vec3(2, 2, 2), vec3(4, 2, 2), vec3(2, 0, 2),vec3(0, 0, 1),0);
    triangle_data[2] = Triangle(vec3(2, 0, 2), vec3(4, 0, 2), vec3(2, 0, 0),vec3(1, 0, 0),0);//низ
    triangle_data[3] = Triangle(vec3(4, 0, 0), vec3(2, 0, 0), vec3(4, 0, 2),vec3(1, 0, 0),0);
    triangle_data[4] = Triangle(vec3(2, 0, 2), vec3(2, 0, 0), vec3(2, 2, 2),vec3(0, 1, 0),0);//левый бок
    triangle_data[5] = Triangle(vec3(2, 2, 0), vec3(2, 2, 2), vec3(2, 0, 0),vec3(0, 1, 0),0);
    triangle_data[6] = Triangle(vec3(2, 2, 0), vec3(4, 2, 0), vec3(2, 2, 2),vec3(1, 0, 0),0);//верхушка
    triangle_data[7] = Triangle(vec3(4, 2, 2), vec3(2, 2, 2), vec3(4, 2, 0),vec3(1, 0, 0),0);
    triangle_data[8] = Triangle(vec3(2, 0, 0), vec3(4, 2, 0), vec3(2, 2, 0),vec3(0, 0, 1),0);//перед
    triangle_data[9] = Triangle(vec3(4, 2, 0), vec3(2, 0, 0), vec3(4, 0, 0),vec3(0, 0, 1),0);
    triangle_data[10] = Triangle(vec3(4, 0, 0), vec3(4, 0, 2), vec3(4, 2, 0),vec3(0, 1, 0),0);//правый бок
    triangle_data[11] = Triangle(vec3(4, 2, 2), vec3(4, 2, 0), vec3(4, 0, 2),vec3(0, 1, 0),0);

    triangle_data[12] = Triangle(vec3(6, -2, 2), vec3(4, -2, 2), vec3(6, 0, 2),vec3(0, 0, 1),0);//задняя стенка
    triangle_data[13] = Triangle(vec3(4, 0, 2), vec3(6, 0, 2), vec3(4, -2, 2),vec3(0, 0, 1),0);
    triangle_data[14] = Triangle(vec3(4, -2, 2), vec3(6, -2, 2), vec3(4, -2, 0),vec3(1, 0, 0),0);//низ
    triangle_data[15] = Triangle(vec3(6, -2, 0), vec3(4, -2, 0), vec3(6, -2, 2),vec3(1, 0, 0),0);
    triangle_data[16] = Triangle(vec3(4, -2, 2), vec3(4, -2, 0), vec3(4, 0, 2),vec3(0, 1, 0),0);//левый бок
    triangle_data[17] = Triangle(vec3(4, 0, 0), vec3(4, 0, 2), vec3(4, -2, 0),vec3(0, 1, 0),0);
    triangle_data[18] = Triangle(vec3(4, 0, 0), vec3(6, 0, 0), vec3(4, 0, 2),vec3(1, 0, 0),0);//верхушка
    triangle_data[19] = Triangle(vec3(6, 0, 2), vec3(4, 0, 2), vec3(6, 0, 0),vec3(1, 0, 0),0);
    triangle_data[20] = Triangle(vec3(4, -2, 0), vec3(6, 0, 0), vec3(4, 0, 0),vec3(0, 0, 1),0);//перед
    triangle_data[21] = Triangle(vec3(6, 0, 0), vec3(4, -2, 0), vec3(6, -2, 0),vec3(0, 0, 1),0);
    triangle_data[22] = Triangle(vec3(6, -2, 0), vec3(6, -2, 2), vec3(6, 0, 0),vec3(0, 1, 0),0);//правый бок
    triangle_data[23] = Triangle(vec3(6, 0, 2), vec3(6, 0, 0), vec3(6, -2, 2),vec3(0, 1, 0),0);

    triangle_data[24] = Triangle(vec3(6, 2, 2), vec3(4, 2, 2), vec3(6, 4, 2),vec3(0, 0, 1),0);//задняя стенка
    triangle_data[25] = Triangle(vec3(4, 4, 2), vec3(6, 4, 2), vec3(4, 2, 2),vec3(0, 0, 1),0);
    triangle_data[26] = Triangle(vec3(4, 2, 2), vec3(6, 2, 2), vec3(4, 2, 0),vec3(1, 0, 0),0);//низ
    triangle_data[27] = Triangle(vec3(6, 2, 0), vec3(4, 2, 0), vec3(6, 2, 2),vec3(1, 0, 0),0);
    triangle_data[28] = Triangle(vec3(4, 2, 2), vec3(4, 2, 0), vec3(4, 4, 2),vec3(0, 1, 0),0);//левый бок
    triangle_data[29] = Triangle(vec3(4, 4, 0), vec3(4, 4, 2), vec3(4, 2, 0),vec3(0, 1, 0),0);
    triangle_data[30] = Triangle(vec3(4, 4, 0), vec3(6, 4, 0), vec3(4, 4, 2),vec3(1, 0, 0),0);//верхушка
    triangle_data[31] = Triangle(vec3(6, 4, 2), vec3(4, 4, 2), vec3(6, 4, 0),vec3(1, 0, 0),0);
    triangle_data[32] = Triangle(vec3(4, 2, 0), vec3(6, 4, 0), vec3(4, 4, 0),vec3(0, 0, 1),0);//перед
    triangle_data[33] = Triangle(vec3(6, 4, 0), vec3(4, 2, 0), vec3(6, 2, 0),vec3(0, 0, 1),0);
    triangle_data[34] = Triangle(vec3(6, 2, 0), vec3(6, 2, 2), vec3(6, 4, 0),vec3(0, 1, 0),0);//правый бок
    triangle_data[35] = Triangle(vec3(6, 4, 2), vec3(6, 4, 0), vec3(6, 2, 2),vec3(0, 1, 0),0);
   
    triangle_data[36] = Triangle(vec3(8, 0, 2), vec3(6, 0, 2), vec3(8, 2, 2),vec3(0, 0, 1),0);//задняя стенка
    triangle_data[37] = Triangle(vec3(6, 2, 2), vec3(8, 2, 2), vec3(6, 0, 2),vec3(0, 0, 1),0);
    triangle_data[38] = Triangle(vec3(6, 0, 2), vec3(8, 0, 2), vec3(6, 0, 0),vec3(1, 0, 0),0);//низ
    triangle_data[39] = Triangle(vec3(8, 0, 0), vec3(6, 0, 0), vec3(8, 0, 2),vec3(1, 0, 0),0);
    triangle_data[40] = Triangle(vec3(6, 0, 2), vec3(6, 0, 0), vec3(6, 2, 2),vec3(0, 1, 0),0);//левый бок
    triangle_data[41] = Triangle(vec3(6, 2, 0), vec3(6, 2, 2), vec3(6, 0, 0),vec3(0, 1, 0),0);
    triangle_data[42] = Triangle(vec3(6, 2, 0), vec3(8, 2, 0), vec3(6, 2, 2),vec3(1, 0, 0),0);//верхушка
    triangle_data[43] = Triangle(vec3(8, 2, 2), vec3(6, 2, 2), vec3(8, 2, 0),vec3(1, 0, 0),0);
    triangle_data[44] = Triangle(vec3(6, 0, 0), vec3(8, 2, 0), vec3(6, 2, 0),vec3(0, 0, 1),0);//перед
    triangle_data[45] = Triangle(vec3(8, 2, 0), vec3(6, 0, 0), vec3(8, 0, 0),vec3(0, 0, 1),0);
    triangle_data[46] = Triangle(vec3(8, 0, 0), vec3(8, 0, 2), vec3(8, 2, 0),vec3(0, 1, 0),0);//правый бок
    triangle_data[47] = Triangle(vec3(8, 2, 2), vec3(8, 2, 0), vec3(8, 0, 2),vec3(0, 1, 0),0);

    Ray ray=GenerateRay(camera);
    FragColor=Raytrace(ray);
        
    //FragColor = vec4 (abs(ray.direction.xy), 0, 1.0);//цветной фон
    //FragColor = vec4(abs(sphere_data[1].center),1);

}
