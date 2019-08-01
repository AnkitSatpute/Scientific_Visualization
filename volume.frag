#version 150
//#extension GL_ARB_shading_language_420pack : require
#extension GL_ARB_explicit_attrib_location : require
#define TASK 10
#define ENABLE_OPACITY_CORRECTION 0
#define ENABLE_LIGHTNING 0
#define ENABLE_SHADOWING 0

in vec3 ray_entry_position;

layout(location = 0) out vec4 FragColor;

uniform mat4 Modelview;

uniform sampler3D volume_texture;
uniform sampler2D transfer_texture;


uniform vec3    camera_location;
uniform float   sampling_distance;
uniform float   sampling_distance_ref;
uniform float   iso_value;
uniform vec3    max_bounds;
uniform ivec3   volume_dimensions;


uniform vec3    light_position;
uniform vec3    light_ambient_color;
uniform vec3    light_diffuse_color;
uniform vec3    light_specular_color;
uniform float   light_ref_coef;

bool
inside_volume_bounds(const in vec3 sampling_position)
{
    return (   all(greaterThanEqual(sampling_position, vec3(0.0)))
            && all(lessThanEqual(sampling_position, max_bounds)));
}


float
get_sample_data(vec3 in_sampling_pos)
{
    vec3 obj_to_tex = vec3(1.0) / max_bounds;
    return texture(volume_texture, in_sampling_pos * obj_to_tex).r;

}

vec3 get_gradient(vec3 pos) {

    vec3 step = max_bounds/volume_dimensions; 

    vec3 gradient;
    gradient.x = get_sample_data(vec3(pos.x+step.x, pos.y, pos.z)) - get_sample_data(vec3(pos.x-step.x, pos.y, pos.z));
    gradient.y = get_sample_data(vec3(pos.x, pos.y + step.y, pos.z)) - get_sample_data(vec3(pos.x, pos.y - step.y, pos.z));
    gradient.z = get_sample_data(vec3(pos.x, pos.y, pos.z + step.z)) - get_sample_data(vec3(pos.x, pos.y, pos.z - step.z));
    return normalize(gradient);
}

vec3 getDiffuseColor(in vec3 kd, in vec3 G, in vec3 L){
    float GdotL = max(dot(G,L),0.0);
    return kd * light_ref_coef * GdotL ;
}

vec3 phong_model(vec3 in_sampling_pos){

    float s = get_sample_data(in_sampling_pos);
    vec4 kd = texture(transfer_texture, vec2(s,s));
    vec3 L = normalize(get_gradient(in_sampling_pos));
    vec3 Light_vec = light_position + in_sampling_pos;
    float Ipx = kd.x * light_specular_color.x*max(0, dot(L,Light_vec));
    float Ipy = kd.y * light_specular_color.y*max(0, dot(L,Light_vec));
    float Ipz = kd.z * light_specular_color.z*max(0, dot(L,Light_vec));
    vec3 phong = vec3(Ipx,Ipy,Ipz);
    return phong;
}

void main()
{
    /// One step trough the volume
    vec3 ray_increment      = normalize(ray_entry_position - camera_location) * sampling_distance;
    /// Position in Volume
    vec3 sampling_pos       = ray_entry_position + ray_increment; // test, increment just to be sure we are in the volume

    /// Init color of fragment
    vec4 dst = vec4(0.0, 0.0, 0.0, 0.0);

    /// check if we are inside volume
    bool inside_volume = inside_volume_bounds(sampling_pos);
    
    if (!inside_volume)
        discard;

#if TASK == 10
    vec4 max_val = vec4(0.0, 0.0, 0.0, 0.0);
    
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume) 
    {      
        // get sample
        float s = get_sample_data(sampling_pos);
                
        // apply the transfer functions to retrieve color and opacity
        vec4 color = texture(transfer_texture, vec2(s, s));
           
        // this is the example for maximum intensity projection
        max_val.r = max(color.r, max_val.r);
        max_val.g = max(color.g, max_val.g);
        max_val.b = max(color.b, max_val.b);
        max_val.a = max(color.a, max_val.a);
    
        // increment the ray sampling position
        sampling_pos  += ray_increment;

        // update the loop termination condition
        inside_volume  = inside_volume_bounds(sampling_pos);
    }

    dst = max_val;
#endif 
    
#if TASK == 11
    vec4 avg_val = vec4(0.0, 0.0, 0.0, 0.0);
    float i = 0;
    float k = 0;
    float l = 0;
    float m = 0;
    float n = 0;
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume) 
    {      
        // get sample
        float s = get_sample_data(sampling_pos);
        // apply the transfer functions to retrieve color and opacity
        vec4 color = texture(transfer_texture, vec2(s, s)); 
        k = k + color.r;
        l = l + color.g;
        m = m + color.b;
        n = n + color.a;
        i++;
        // increment the ray sampling position
        sampling_pos  += ray_increment;
        // update the loop termination condition
        inside_volume  = inside_volume_bounds(sampling_pos);
    }
    avg_val.r = k / i;
    avg_val.g = l / i;
    avg_val.b = m / i;
    avg_val.a = n / i;
    dst = avg_val;
#endif
#if TASK == 12 || TASK == 13
    vec4 ncolor = vec4(0.0,0.0,0.0,0.0);
    vec4 color2 ;
    float shadow = 1.0;
    vec3 phong_shader = vec3(0.0,0.0,0.0);
    vec3 save_sampling_pos = vec3(0.0,0.0,0.0);
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume)
    {
        // get sample
        float s = get_sample_data(sampling_pos);

        if(s>iso_value){
            save_sampling_pos = sampling_pos;
        }
        /*vec4 color = texture(transfer_texture, vec2(s, s));
        // dummy code
        if (color.b > iso_value){
            dst = vec4(light_diffuse_color, 1);
            break;  
        }
        else {
            dst = vec4(light_diffuse_color, 0);    
        }*/
        // increment the ray sampling position
#if TASK == 13 // Binary Search

        float s2 = get_sample_data(sampling_pos);
        color2 = texture(transfer_texture, vec2(s2,s2));

        if(s2> iso_value){
            vec3 low = sampling_pos - ray_increment;
            vec3 high = sampling_pos;
            vec3 mid;
            for (int b = 0; b < 32; ++b){
                mid = (low + high)/2.0;
                float mid_s = get_sample_data(mid);
                if (mid_s > iso_value){
                    high = mid;
                }
                else {
                    low = mid;
                }
            }
            save_sampling_pos = mid;
        }
        /*float new_s = get_sample_data(sampling_pos);
        vec4 new_color = texture(transfer_texture, vec2(new_s, new_s));
        dst = vec4(new_color.rgb, 0.0); */
#endif
#if ENABLE_LIGHTNING == 1 // Add Shading
        
        phong_shader = phong_model(save_sampling_pos);

#if ENABLE_SHADOWING == 1 // Add Shadows
        shadow = 0.0;
#endif
#endif
        sampling_pos += ray_increment;
        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
        if(save_sampling_pos!= vec3(0,0,0)){
            break;
        }
    }
    if(phong_shader!=vec3(0,0,0)){
        dst = vec4(phong_shader,1.0);
    }
    else{
        float s2 = get_sample_data(save_sampling_pos);
        vec4 color2 = texture(transfer_texture, vec2(s2, s2));
        dst = vec4(color2.x*shadow,color2.y*shadow,color2.z*shadow,color2.a);
    }
#endif 
#if TASK == 31
    vec4 color4;
    int i = 0;
    vec3 save_sampling_pos = vec3(0.0,0.0,0.0);
    vec3 save_sampling_pos2 = vec3(0.0,0.0,0.0);
    float trans=1;
    float save_trans=0;
    vec3 d;
    vec3 ds;
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume)
    {
        float ss = get_sample_data(sampling_pos);
        vec4 colorS = texture(transfer_texture, vec2(ss,ss));
        // get sample
#if ENABLE_OPACITY_CORRECTION == 1 // Opacity Correction
       /* d = sampling_distance;
        ds = sampling_distance_ref; 
        color4.r = 1 - pow(1-color4.r, (sampling_distance_ref/sampling_distance));
        color4.g = 1 - pow(1-color4.g, (sampling_distance_ref/sampling_distance));
        color4.b = 1 - pow(1-color4.b, (sampling_distance_ref/sampling_distance));  */
        //color4.a = 1 - pow((1- color4.a), (sampling_distance_ref/sampling_distance));
        trans = 1 - pow((1- trans),(sampling_distance_ref/sampling_distance));   // shows some output latest
        //color4.a = 1 - pow((1- color4.a),(sampling_distance_ref/sampling_distance));
#else
        //float s = get_sample_data(sampling_pos);
#endif
        // dummy code
        //dst = vec4(light_specular_color, 1.0);

        // increment the ray sampling positi

#if ENABLE_LIGHTNING == 1 // Add Shading
        colorS = vec4(phong_model(sampling_pos), colorS.a);
#endif
        trans = trans* (1- save_trans);
        color4 = color4 + vec4(colorS.x*trans, colorS.y*trans,colorS.z*trans, colorS.a*trans);
        save_trans = color4.a;
        if(trans<0.1){
            break;
        }
        sampling_pos += ray_increment;
        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
        if(ss>iso_value){
            save_sampling_pos = sampling_pos;
            dst = color4;
            i = i +1;
            if (i == 1){
                save_sampling_pos2 = sampling_pos;
                float s1 = get_sample_data(save_sampling_pos2);
                vec4 colorS1 = texture(transfer_texture, vec2(s1,s1));
                dst = colorS1;
                break;
            }
        }
    }
    
#endif 

    // return the calculated color value
    FragColor = dst;
}