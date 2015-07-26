// ----------------------------------------------------------------------------
// glm.experimental.js - glm-js experimental stuff
// https://github.com/humbletim/glm-js
// copyright(c) 2015 humbletim
// MIT LICENSE
// ----------------------------------------------------------------------------

GLM.exists;
GLM.$vectorType.exists;

if (GLM.$toTypedArray) throw "error: glm.experimental.js double-included";

// coerces elementSource into the specified arrayType:
//   arrayType<typedarray constructor>,
//   elementSource<glm-object|typedarray|arraybuffer|array|number*<componentLength>>,
//   componentLength<number> (only needed if elementSource is also a number)
GLM.$toTypedArray = function(arrayType, elementSource, componentLength) {
   var sz = elementSource || 0;
   var sztype = typeof sz;

   if (sztype === 'number') {
      if (typeof componentLength !== 'number')
         throw new GLM.GLMJSError("GLM.$toTypedArray: unsupported argtype for componentLength ("+typeof componentLength+")");
      return new arrayType(sz * componentLength);
   }
   if (sztype !== 'object')
      throw new GLM.GLMJSError("GLM.$toTypedArray: unsupported arrayType: "+[typeof arrayType, arrayType]);

   if (sz instanceof arrayType)
      return sz;

   if (sz instanceof GLM.$outer.ArrayBuffer || Array.isArray(sz))
      return new arrayType(sz);

   if (GLM.$isGLMObject(sz)) {
      var ref = sz.elements;
      sz = new arrayType(ref.length);
      sz.set(ref);
      //if (arrayType === Float32Array)
      //   return sz;
      // ... otherwise, fall-thru since may require manual coercion
   }

   if (!(sz instanceof arrayType)) {
      if ("byteOffset" in sz && "buffer" in sz) {
         GLM.$DEBUG && GLM.$outer.console.warn(
            "coercing "+sz.constructor.name+".buffer into "+
               [arrayType.name, sz.byteOffset, sz.byteLength+" bytes",
                "~"+(sz.byteLength / arrayType.BYTES_PER_ELEMENT)+" coerced elements"
               ]+"...", { byteOffset: sz.byteOffset, byteLength: sz.byteLength,
                          ecount: sz.byteLength / arrayType.BYTES_PER_ELEMENT });
         return new arrayType(sz.buffer,
                              sz.byteOffset,
                              sz.byteLength / arrayType.BYTES_PER_ELEMENT);
      }
   }

   if (sz instanceof arrayType)
      return sz;
   throw new GLM.GLMJSError("GLM.$toTypedArray: unsupported argtype initializers: "+[arrayType, elementSource, componentLength]);
};

//GLM.$DEBUG = 1;
GLM.$make_primitive = function(type, typearray) {
   GLM[type] = function(v) {
      if (!(this instanceof glm[type]))
         return new glm[type](v);
      if (typeof v !== 'object') v = [v];
      this.elements = GLM.$toTypedArray(typearray, v, 1);
   };
   /*TRACING*/ GLM[type] = eval(GLM.$template._traceable("glm_"+type+"$class", GLM[type]))();

   GLM.$template._add_overrides(
      type,
      {
         $to_string: function(v) { return v.$type.replace(/[^a-z]/g,'')+'('+v.elements[0]+')';  },
         $to_object: function(v) { return v.elements[0]; },
         $to_glsl: function(v) { return v.$type.replace(/[^a-z]/g,'')+'('+v.elements[0]+')';  }
      }
   );

   GLM.$template._add_overrides(
      type.substr(1),  // $float => float
      {
         $to_string: !(type.substr(1) in GLM.$to_string.$template) && function(v) { return v.$type.replace(/[^a-z]/g,'')+'('+v.elements[0]+')';  },
         $to_object: function(v) { return v; },
         $to_glsl: function(v) { return v.$type.replace(/[^a-z]/g,'')+'('+v+')';  }

      }
   );

   GLM.$template.extend(
      GLM[type],
      {
         componentLength: 1,
         BYTES_PER_ELEMENT: typearray.BYTES_PER_ELEMENT,
         prototype: GLM.$template.extend(
            new GLM.$GLMBaseType(GLM[type], type),
            {
               copy: function(v) {
                  this.elements.set(GLM.$isGLMObject(v) ? v.elements : [v]);
                  return this;
               },
               valueOf: function() {
                  return this.elements[0];
               }
            })
      });
   GLM[type].prototype['='] = GLM[type].prototype.copy;

   return GLM[type];
};

GLM.$make_primitive("$bool", GLM.$outer.Int32Array);
GLM.$template.jstypes['boolean'] = 'float'; // internal representation
GLM.$make_primitive("$int32", GLM.$outer.Int32Array);
GLM.$make_primitive("$uint32", GLM.$outer.Uint32Array);
GLM.$make_primitive("$uint16", GLM.$outer.Uint16Array);
GLM.$make_primitive("$float", GLM.$outer.Float32Array);

GLM.$make_primitive_vector = function(type, glmtype, typearray) {
   typearray = typearray || new glmtype().elements.constructor;
   var $class = function(sz) {
      if (!(this instanceof $class))
         return new $class(sz);
      this.$type = type;
      //this.componentLength = glmtype.componentLength;
      this.$type_name = 'vector<'+type+'>';
      var ele = GLM.$toTypedArray(typearray, sz, glmtype.componentLength);
      if (ele)
         this._set(ele);
   };
   /*TRACING*/ $class = eval(GLM.$template._traceable("glm_"+type+"$class", $class))();

   $class.prototype = new GLM.$vectorType(glmtype, 0, typearray);

   GLM.$template._add_overrides(
      type,
      {
         $to_string: function(what) { return "[GLM."+what.$type+" elements[0]="+(what.elements&&what.elements[0])+"]"; },
         $to_object: function(v) { return v.map(GLM.$to_object);  },
         $to_glsl: function(v,name) {
            // eg: glm.$vvec4(4) ==> 'vec4 example[4];example[0]=vec4(...);example[1]=vec4(...);...'
            var t = v.$type.substr(2).replace(/[^a-z]/g,'');
            name=typeof name === 'string' ? name : 'example';
            var def = [];
            if (name)
               def.push(t+' '+name+'['+v.length+']');
            return def.concat(
               v.map(function(vv,_) {
                        return name+'['+_+'] = '+vv;
                     })).join(";")+";";
         }
      }
   );

   GLM.$types.push(type);

   GLM.$template.extend(
      $class.prototype,
      {
         $type: type,
         constructor: $class,
         _setup: function() { throw new GLM.GLMJSError("._setup not available on primitive vectors yet..."); },
         _set: function(e) {
            //Object.defineProperty(this, 'elements', { configurable: true, value: e });//GLM.$toTypedArray(this.typearray, e, this.glmtype.componentLength);
            this.elements = e;
            this.length = !this.elements ? 0 : (this.elements.length / this.glmtype.componentLength);
            //if (this.length)
            this.arrayize();
            return this;
         },

         arrayize: function() {
            var elements = this.elements;
            var sprop = Object.defineProperty.bind(Object, this);
            for(var i=0; i < this.length; i++) {
               (function(_) {
                   sprop(_,
                         {
                            configurable: true,
                            enumerable: true,
                            get: function() {
                               return this.elements[_];
                            },
                            set: function(v) {
                               return this.elements[_] = v;
                            }
                         });
                })(i);
            }
//             "forEach,map,slice,filter,join,reduce".split(",").forEach(
//                function(k) { this[k] = Array.prototype[k]; }.bind(this));
            return this._mixinArray(this)
         },
         toString: function() {
            return "[vector<"+type+"> {"+[].slice.call(this.elements,0,5)+(this.elements.length > 5?",...":"")+"}]";
         }
      });

   return $class;
};

GLM.$vint32 = GLM.$make_primitive_vector('$vint32', GLM.$int32);
GLM.$vfloat = GLM.$make_primitive_vector('$vfloat', GLM.$float);
GLM.$vuint16 = GLM.$make_primitive_vector('$vuint16', GLM.$uint16);
GLM.$vuint32 = GLM.$make_primitive_vector('$vuint32', GLM.$uint32);

GLM.$make_componentized_vector = function(type, glmtype, typearray) {
   typearray = typearray || new glmtype().elements.constructor;
   var $class = function(_sz, dynamic) {
      if (!(this instanceof $class))
         return new $class(_sz, dynamic);
      this._set(
         GLM.$toTypedArray(typearray, _sz, glmtype.componentLength)
      );
      if (!this.elements) throw new GLM.GLMJSError("!this.elements: " + [GLM.$toTypedArray(typearray, _sz, glmtype.componentLength)]);
      this._setup({
                     setters: true,
                     dynamic: dynamic,
                     container: 'self'
                  });
   };
   /*TRACING*/ $class = eval(GLM.$template._traceable("glm_"+type+"$class", $class))();

   $class.prototype = new GLM.$vectorType(glmtype, 0, typearray);

   GLM.$template._add_overrides(
      type,
      {
         $to_string: function(what) { return "[GLM."+what.$type+" elements[0]="+(what.elements&&what.elements[0])+"]"; },
         $to_object: function(v) { return v.map(GLM.$to_object);  },
//         $to_glsl: function(v) { return type.substr(2)+'['+v.length+']('+v.map(GLM.$to_glsl)+')'; }
//         $to_glsl: function(v) { return v.map(GLM.$to_glsl);  }
         $to_glsl: function(v,name) {
            var t = v.$type.substr(2);
            name=typeof name === 'string' ? name : 'example';
            var def = [];
            if (name)
               def.push(t+' '+name+'['+v.length+']');
            return def.concat(
               v.map(GLM.$to_glsl)
                  .map(function(vv,_) {
                          return name+'['+_+'] = '+vv;
                       })).join(";\n ")+";";
         }
      }
    );

   GLM.$types.push(type);

   GLM.$template.extend($class.prototype,
                        {
                           $type: type,
                           constructor: $class
                        });
   if (!$class.prototype.componentLength) alert('!cmop '+p);
   return $class;
};

(function(){
    var $makers = GLM.$template.deNify(
       {
          '$vvec<N>': function() {
             return GLM.$make_componentized_vector("$vvecN", glm.vecN);
          },
          '$vuvec<N>': function() {
             return GLM.$make_componentized_vector("$vuvecN", glm.uvecN);
          },
          '$vmat<N>': function(_sz) {
             return GLM.$make_componentized_vector("$vmatN", glm.matN);
          },
          '$vquat': function() {
             return GLM.$make_componentized_vector("$vquat", glm.quat);
          }
       });
    for(var p in $makers) {
       GLM[p] = $makers[p]();
    }
 })();


// experimental support for transcoding swizzles:
//  .base64 <=> <base64-encoded representation>
//  .json <=> <JSON-encoded representation>
//  .glsl <=> <GLSL-encoded representation>
(function() {
    GLM.$b64 = (function(d){
                   var A=GLM.$outer.ArrayBuffer, U=GLM.$outer.Uint8Array, D=d.indexOf.bind(d);
                   return {
                      b64_to_utf8: function(s){return decodeURIComponent(escape(atob(s)));},
                      utf8_to_b64: function(s){return btoa(unescape(encodeURIComponent(s)));},
                      encode: function(b,off,len){b=new U(b,off,len);var a,e=b.length,c="";for(a=0;a<e;a+=3)c+=d[b[a]>>2],c+=d[(b[a]&3)<<4|b[a+1]>>4],c+=d[(b[a+1]&15)<<2|b[a+2]>>6],c+=d[b[a+2]&63];2===e%3?c=c.substring(0,c.length-1)+"=":1===e%3&&(c=c.substring(0,c.length-2)+"==");return c},
                      decode: function(b){var _=b.length,a=0.75*_,e=_,c=0,i,f,g,j;"="===b[_-1]&&(a--,"="===b[_-2]&&a--);for(var k=new A(a),h=new U(k),a=0;a<e;a+=4)i=D(b[a]),f=D(b[a+1]),g=D(b[a+2]),j=D(b[a+3]),h[c++]=i<<2|f>>4,h[c++]=(f&15)<<4|g>>2,h[c++]=(g&3)<<6|j&63;return k}
                   };
                })("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");

    GLM.$to_base64 = function $to_base64(v) {
       return GLM.$b64.encode(
          v.elements.buffer,
          v.elements.byteOffset,
          v.elements.byteLength
       );
    };

    "vec2,vec3,vec4,mat3,mat4,uvec2,uvec3,uvec4,quat".split(",")
       .map(GLM.$getGLMType)
       .forEach(
          function(o) {
             Object.defineProperty(
                o.prototype, 'base64',
                {
                   get: function() {
                      return GLM.$to_base64(this);
                   },
                   set: function(a) {
                      //return this.elements.set(new Float32Array(GLM.$b64.decode(a)));
                      return this['='](
                         new this.constructor(
                            new this.elements.constructor(
                               GLM.$b64.decode(a)
                            )
                         )
                      );
                   }
                });
             Object.defineProperty(
                o.prototype, 'json',
                {
                   get: function() {
                      return GLM.$to_json(this);
                   },
                   set: function(a) {
                      return this['='](new this.constructor(JSON.parse(a)));
                   }
                });
             Object.defineProperty(
                o.prototype, 'glsl',
                {
                   get: function() {
                      return GLM.$to_glsl(this);
                   },
                   set: function(a) {
                      return this['='](new this.constructor(GLM.$from_glsl(a,true)));
                   }
                });
          });
 })();

