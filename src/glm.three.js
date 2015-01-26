// ----------------------------------------------------------------------------
// three.js GLM math adapter
// copyright(c) 2015 humbletim
// https://github.com/humbletim/glm-js
// MIT LICENSE
// ----------------------------------------------------------------------------

try {
   THREE.exists;
} catch(e) {
   THREE = THREEMATHS;
}

glm = GLM;
//throw new glm.GLMJSError(glm.degrees(5));
var DLL = glm.$DLL['three.js'] = {
   vendor_name: "three.js",
   vendor_version: THREE.REVISION,
   
   _name: 'glm.three.js',
   _version: '0.0.0',

   $tmp: {
      euler: new THREE.Euler(),
      mat4: new THREE.Matrix4(),
      quat: new THREE.Quaternion(),
      vec4: new THREE.Vector4(),
      vec3: new THREE.Vector3(),
      vec2: new THREE.Vector2()
   }
};
   
DLL.$functions = (
   function($tmp) {
      return {
//          degrees: function(n) { return THREE.Math.radToDeg(n); },
//          radians: function(n) { return THREE.Math.degToRad(n); },
         mat4_perspective: function(fov, aspect, near, far) {
            fov = glm.degrees(fov);
            return glm.make_mat4(
               $tmp.mat4.makePerspective( fov, aspect, near, far ).elements
            );
         }, 
         mat4_angleAxis: function(theta, axis) {
            return glm.make_mat4(
               $tmp.mat4.makeRotationAxis(axis,theta).elements
            );
         },
         quat_angleAxis: function(angle, axis) {
            return new glm.quat(
               $tmp.quat.setFromAxisAngle(glm.normalize(axis), angle)
            );
         },
         mat4_translation: function(v) {
            return glm.make_mat4(
               $tmp.mat4.makeTranslation(v.x,v.y,v.z).elements
            );
         },
         mat4_scale: function(v) {
            return glm.make_mat4(
               $tmp.mat4.makeScale(v.x,v.y,v.z).elements
            );
         },
         vec3_eulerAngles: function(q) {
            return new glm.vec3($tmp.euler.setFromQuaternion(q, 'ZYX'));
         },
         mat4_array_from_quat: function(q) {
            return $tmp.mat4.makeRotationFromQuaternion(q).elements;
         },
         quat_array_from_mat4: function(o) {
            return $tmp.quat.setFromRotationMatrix(o).toArray();
         }
      };
   })(DLL.$tmp);

(  function($tmp) {
      glm.$template.operations(
         {
            'mul': {
               op: '*',
               'quat,vec3': function(a,b) {
                  // need $tmp.quat.copy(a) to entertain THREE.Quaternion
                  return $tmp.vec3.applyQuaternion.call(b.clone(), $tmp.quat.copy(a));
               },
               'vec4,quat': function(a,b) {
                  // need $tmp.quat.copy(a) to entertain THREE.Quaternion
                  return $tmp.vec4.applyMatrix4.call(a.clone(), glm.toMat4(b));
               },
               'vec3,quat': function(a,b) { return this['quat,vec3'](b,a); },
               'vec<N>,float': function(a,b) {
                  return $tmp.vecN.multiplyScalar.call(a.clone(), b);
               },
               //          'vec3,float': function(a,b) {
               //             return $tmp.vec3.multiplyScalar.call(a.clone(), b);
               //          },
               //          'vec2,float': function(a,b) {
               //             return $tmp.vec2.multiplyScalar.call(a.clone(), b);
               //          },
               'mat4,vec4': function(a,b) {
                  return $tmp.vec4.applyMatrix4.call(b.clone(), a);
               },
               'mat4,mat4': function(a,b) {
                  a = a.clone();
                  return $tmp.mat4.multiplyMatrices.call(a, a, b);
               }
            },
            'mul_eq': {
               op: '*=',
               'vec<N>,float': function(a,b) {
                  return $tmp.vecN.multiplyScalar.call(a, b);
               },
               'mat4,mat4': function(a,b) {
                  //a = a.clone();
                  return $tmp.mat4.multiplyMatrices.call(a, a, b);
               },
            }
         });

      glm.$template.functions(
         {
            mix: {
               $tmp2: $tmp.quat.clone(),
               "quat,quat": function(a,b,rt) {
                  return new glm.quat($tmp.quat.copy(a).slerp(this.$tmp2.copy(b),rt));//new glm.quat(GLMAT.quat.slerp(new Float32Array(4), a.elements,b.elements,rt));
               }
            }
         });

      glm.$template.calculators(
         {
            normalize: {
               'vec<N>': function(q) { 
                  return new glm.vecN($tmp.vecN.copy(q).normalize());
               },
               quat: function(q) { 
                  return new glm.quat($tmp.quat.copy(q).normalize());
               },
            },
            length2: {
               "vec<N>": function(v) { return $tmp.vecN.lengthSq.call(v); },
               quat: function(q) { return $tmp.quat.copy(q).lengthSq(); },
            },
            length: {
               "vec<N>": function(v) { return $tmp.vecN.length.call(v); },

               quat: function(q) { return $tmp.quat.copy(q).length(); },
               //             vec3: function(v) { return $tmp.vec3.length.call(v); },
               //             vec4: function(v) { return $tmp.vec4.length.call(v); },
            },
            inverse: {
               quat: function(q) { 
                  return new glm.quat($tmp.quat.set(q.x,q.y,q.z,q.w).inverse());
               },
               mat4: function(m) { return new glm.mat4($tmp.mat4.getInverse(m)); },
            },
            transpose: {
               mat4: function(m) { return $tmp.mat4.transpose.call(m.clone()); },
            },
            clamp: {
               '': function() { assert(false) },
            }
         });
   })(DLL.$tmp);

glm.$intern(DLL.$functions);

// TODO: fixme... cache internal to $template funcs
$tmp = DLL.$tmp;

glm.init({vendor_name:DLL.vendor_name, vendor_version: DLL.vendor_version}, 'glm-js[three]: ');

try { module.exports = glm; } catch(e) {}



