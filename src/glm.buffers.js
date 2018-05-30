// ----------------------------------------------------------------------------
// glm.buffers.js - glm-js ArrayBuffer / data views
// https://github.com/humbletim/glm-js
// copyright(c) 2015 humbletim
// MIT LICENSE
// ----------------------------------------------------------------------------

function $GLMVector(typ, sz, typearray) {
   typearray = typearray || GLM.$outer.Float32Array;
   this.typearray = typearray;
   if (!(this instanceof $GLMVector)) throw new GLM.GLMJSError('use new');
   if (!('function' === typeof typ) || !GLM.$isGLMConstructor(typ))
      throw new GLM.GLMJSError('expecting typ to be GLM.$isGLMConstructor: '+
                               [typeof typ, (typ?typ.$type:typ)]+" // "+
                               GLM.$isGLMConstructor(typ));
   if (typ.componentLength === 1 && GLM[typ.prototype.$type.replace("$","$$v")])
      throw new GLM.GLMJSError("unsupported argtype to glm.$vectorType - for single-value types use glm."+typ.prototype.$type.replace("$","$$v")+"..."+typ.prototype.$type);
   this.glmtype = typ;
   if (!this.glmtype.componentLength) throw new Error('need .componentLength '+[typ, sz, typearray]);
   this.componentLength = this.glmtype.componentLength;
   this.BYTES_PER_ELEMENT = this.glmtype.BYTES_PER_ELEMENT;

   this._set_$elements = function _set_$elements(elements) {
      Object.defineProperty(this, '$elements', { enumerable: false, configurable: true, value: elements });
      return this.$elements;
   };

   Object.defineProperty(
      this, 'elements',
      { enumerable: true,
        configurable: true,
        get: function() { return this.$elements; },
        set: function(elements) {
           if (this._kv && !this._kv.dynamic)
              GLM.$DEBUG && GLM.$outer.console.warn("WARNING: setting .elements on frozen (non-dynamic) GLMVector...");
           if (!elements) {
              this.length = this.byteLength = 0;
           } else {
              var oldlength = this.length;
              this.length = elements.length / this.componentLength;
              this.byteLength = this.length * this.BYTES_PER_ELEMENT;
              if (this.length !== Math.round(this.length))
                 throw new GLM.GLMJSError(
                    '$vectorType.length alignment mismatch '+
                       JSON.stringify(
                          {componentLength:this.componentLength,
                           length:this.length,
                           rounded_length:Math.round(this.length),
                           elements_length: elements.length,
                           old_length: oldlength
                          }));
           }
           return this._set_$elements(elements);
        }
      });

   this.elements = sz && new typearray(sz * typ.componentLength);

}

GLM.$vectorType = $GLMVector;
GLM.$vectorType.version = '0.0.2';

$GLMVector.prototype = GLM.$template.extend(
   new GLM.$GLMBaseType($GLMVector, '$vectorType'),
   {
      toString: "function() {\n" +
      "   return '[$GLMVector .elements=#''+(this.elements&&this.elements.length)+\n" +
      "      ' .elements[0]='+(this.elements&&this.elements[0])+\n" +
      "      ' ->[0]''+(this['->']&&this['->'][0])+']'';\n" +
      "}\n",
      '=': "function(elements) {\n" +
      "   if (elements instanceof this.constructor || glm.$isGLMObject(elements))\n" +
      "      elements = elements.elements;\n" +
      "   return (" +
      "function(elements) {\n" +
      "   if (elements instanceof this.constructor)\n" +
      "      elements = new this.typearray(elements.elements);\n" +
      "   if (!(elements instanceof this.typearray))\n" +
      "      throw new GLM.GLMJSError('unsupported argtype to $GLMVector._set '+(elements&&elements.constructor));\n" +
      "   GLM.$DEBUG && GLM.$outer.console.debug('$GLMVector.prototype.set...' +\n" +
      "                'this.elements:'+[this.elements&&this.elements.constructor.name,\n" +
      "                 this.elements&&this.elements.length]+\n" +
      "                'elements:'+[elements.constructor.name,\n" +
      "                 elements.length]);\n" +
      "   var _kv = this._kv;\n" +
      "   this._kv = undefined;\n" +
      "   this.elements = elements;\n" +
      "   if (this.elements !== elements)\n" +
      "      throw new GLM.GLMJSError('err with .elements: '+ [this.glmtype.prototype.$type, this.elements,elements]);\n" +
      "   if (_kv)\n" +
      "      (" +
      "function(kv, oldlen) {\n" +
      "   var vec = this.glmtype;\n" +
      "   var typearray = this.typearray;\n" +
      "   var n = this.length;\n" +
      "   this._kv = kv;\n" +
      "   var stride = kv.stride || this.glmtype.BYTES_PER_ELEMENT,\n" +
      "   offset = kv.offset || this.elements.byteOffset,\n" +
      "   ele = kv.elements || this.elements,\n" +
      "   container = kv.container || this.arr || [],\n" +
      "   bSetters = kv.setters || false,\n" +
      "   dynamic = kv.dynamic || false;\n" +
      "   \n" +
      "   if (container === 'self')\n" +
      "      container = this;\n" +
      "   //console.warn('ele',typeof ele,ele, this.componentLength);\n" +
      "   \n" +
      "   if (!ele)\n" +
      "      throw new GLMJSError('GLMVector._setup - neither kv.elements nor this.elements...');\n" +
      "   \n" +
      "   (" +
      "function(arr) {\n" +
      "   if (arr) {\n" +
      "      var isArray = Array.isArray(arr);\n" +
      "      function _destroy(i) {\n" +
      "         Object.defineProperty(arr, i, { enumerable: true, configurable: true, value: undefined });\n" +
      "         delete arr[i];\n" +
      "         if (!isArray) {\n" +
      "            arr[i] = undefined; // dbl check... fires error if still prop-set\n" +
      "            delete arr[i];\n" +
      "         }\n" +
      "      }\n" +
      "      for(var i=0;i < arr.length; i++) {\n" +
      "         if (i in arr)\n" +
      "            _destroy(i);\n" +
      "      }\n" +
      "      while(i in arr) {\n" +
      "         GLM.$DEBUG && GLM.$outer.console.debug('$destroy', this.name, i);\n" +
      "         _destroy(i++);\n" +
      "      }\n" +
      "      if (isArray)\n" +
      "         arr.length = 0;\n" +
      "   }\n" +
      "})\n" +
      "   (this.arr, oldlen);\n" +
      "   // cleanup\n" +
      "   var arr = this.arr = this['->'] = container;\n" +
      "   \n" +
      "   // add convenience methods to pseudo-Array containers\n" +
      "   if (!Array.isArray(arr)) {\n" +
      "(function(arr) {\n" +
      "   arr.toJSON = " +
      "(function() { return this.slice(0); })\n" +
      "   'forEach,map,slice,filter,join,reduce'.split(',')\n" +
      "      .forEach(function(k) { arr[k] = Array.prototype[k]; });\n" +
      "   return arr;\n" +
      "})\n" +
      "(arr);\n" +
      "   }\n" +
      "   \n" +
      "   var cl = this.componentLength;\n" +
      "   if (!cl) throw new GLM.GLMJSError('no componentLength!?'+Object.keys(this));\n" +
      "   var last = ele.buffer.byteLength;\n" +
      "   var thiz = this;\n" +
      "   for(var i=0; i < n; i++) {\n" +
      "      var off = offset + i*stride;\n" +
      "      var next = off + this.glmtype.BYTES_PER_ELEMENT;//offset + (i+1)*stride;\n" +
      "      function dbg() {\n" +
      "         kv.i = i; kv.next = next; kv.last = last; kv.offset = kv.offset || offset; kv.stride = kv.stride || stride;\n" +
      "         return JSON.stringify(kv);//{i:i, eleO: ele.byteOffset, stride: stride, offset:offset, next:next, last:last});\n" +
      "      }\n" +
      "      if (off > last)\n" +
      "         throw new Error('['+i+'] off '+off+' > last '+last+' '+dbg());\n" +
      "      if (next > last)\n" +
      "         throw new Error('['+i+'] next '+next+' > last '+last+' '+dbg());\n" +
      "      \n" +
      "      arr[i] = null;\n" +
      "      var make_ti = function(ele,off) {\n" +
      "         ///if (!ele) { throw new Error('!ele ' + (+new Date())); onmessage({stop:1}); }\n" +
      "         var ret = new vec(new typearray(ele.buffer,off,cl));\n" +
      "         if (dynamic) // for detecting underlying .elements changes..\n" +
      "         Object.defineProperty(ret, '$elements', { value: ele });\n" +
      "         return ret;\n" +
      "      };\n" +
      "      var ti = make_ti(ele,off);\n" +
      "      \n" +
      "      if (!bSetters && !dynamic) {\n" +
      "         // read-only array elements\n" +
      "         arr[i] = ti;\n" +
      "      } else {\n" +
      "         // update-able array elements\n" +
      "         (function(ti,i,off) {\n" +
      "             Object.defineProperty(\n" +
      "                arr, i,\n" +
      "                {\n" +
      "                   enumerable: true,\n" +
      "                   configurable: true,\n" +
      "                   get: dynamic ?\n" +
      "                      function() {\n" +
      "                         if (ti.$elements !== thiz.elements) {\n" +
      "                            GLM.$log('dynoget rebinding ti',i,off,ti.$elements === thiz.elements);\n" +
      "                            ti = make_ti(thiz.elements,off);\n" +
      "                         }\n" +
      "                         return ti;\n" +
      "                      } :\n" +
      "                      function() { return ti; },\n" +
      "                   set: bSetters && (\n" +
      "                      dynamic ?\n" +
      "                         function(v) {\n" +
      "                            GLM.$log('dynoset',i,off,ti.$elements === thiz.elements);\n" +
      "                            if (ti.$elements !== thiz.elements) {\n" +
      "                               GLM.$log('dynoset rebinding ti',i,off,ti.$elements === thiz.elements);\n" +
      "                               ti = make_ti(thiz.elements,off);\n" +
      "                            }\n" +
      "                            return ti.copy(v);\n" +
      "                         } :\n" +
      "                         function(v,_) {\n" +
      "                            //console.warn('setter' + JSON.stringify({i:i,ti:ti,v:v},0,2));\n" +
      "                            return ti.copy(v);\n" +
      "                         }) || undefined\n" +
      "                });\n" +
      "          })(ti,i,off);\n" +
      "      }\n" +
      "   }\n" +
      "   return this;\n" +
      "})\n" +
      "(_kv);\n" +
      "   return this;\n" +
      "})\n" +
      "(new this.typearray(elements)); // makes a copy\n" +
      "}\n",
      _typed_concat: "function(a,b,out) {\n" +
      "   var n = a.length + b.length;\n" +
      "   out = out || new a.constructor(n);\n" +
      "   out.set(a);\n" +
      "   out.set(b, a.length);\n" +
      "   return out;\n" +
      "}\n",
      '+': "function(elements) {\n" +
      "   if (elements instanceof this.constructor || glm.$isGLMObject(elements))\n" +
      "      elements = elements.elements;\n" +
      "   return new this.constructor((" +
      "function(a,b,out) {\n" +
      "   var n = a.length + b.length;\n" +
      "   out = out || new a.constructor(n);\n" +
      "   out.set(a);\n" +
      "   out.set(b, a.length);\n" +
      "   return out;\n" +
      "})\n" +
      "(this.elements, elements));\n" +
      "}\n",
      '+=': "function(elements) {\n" +
      "   if (elements instanceof this.constructor || glm.$isGLMObject(elements))\n" +
      "      elements = elements.elements;\n" +
      "   return (" +
      "function(elements) {\n" +
      "   if (elements instanceof this.constructor)\n" +
      "      elements = new this.typearray(elements.elements);\n" +
      "   if (!(elements instanceof this.typearray))\n" +
      "      throw new GLM.GLMJSError('unsupported argtype to $GLMVector._set '+(elements&&elements.constructor));\n" +
      "   GLM.$DEBUG && GLM.$outer.console.debug('$GLMVector.prototype.set...' +\n" +
      "                'this.elements:'+[this.elements&&this.elements.constructor.name,\n" +
      "                 this.elements&&this.elements.length]+\n" +
      "                'elements:'+[elements.constructor.name,\n" +
      "                 elements.length]);\n" +
      "   var _kv = this._kv;\n" +
      "   this._kv = undefined;\n" +
      "   this.elements = elements;\n" +
      "   if (this.elements !== elements)\n" +
      "      throw new GLM.GLMJSError('err with .elements: '+ [this.glmtype.prototype.$type, this.elements,elements]);\n" +
      "   if (_kv)\n" +
      "(function(kv, oldlen) {\n" +
      "   var vec = this.glmtype;\n" +
      "   var typearray = this.typearray;\n" +
      "   var n = this.length;\n" +
      "   this._kv = kv;\n" +
      "   var stride = kv.stride || this.glmtype.BYTES_PER_ELEMENT,\n" +
      "   offset = kv.offset || this.elements.byteOffset,\n" +
      "   ele = kv.elements || this.elements,\n" +
      "   container = kv.container || this.arr || [],\n" +
      "   bSetters = kv.setters || false,\n" +
      "   dynamic = kv.dynamic || false;\n" +
      "   \n" +
      "   if (container === 'self')\n" +
      "      container = this;\n" +
      "   //console.warn('ele',typeof ele,ele, this.componentLength);\n" +
      "   \n" +
      "   if (!ele)\n" +
      "      throw new GLMJSError('GLMVector._setup - neither kv.elements nor this.elements...');\n" +
      "   \n" +
      "(function(arr) {\n" +
      "   if (arr) {\n" +
      "      var isArray = Array.isArray(arr);\n" +
      "      function _destroy(i) {\n" +
      "         Object.defineProperty(arr, i, { enumerable: true, configurable: true, value: undefined });\n" +
      "         delete arr[i];\n" +
      "         if (!isArray) {\n" +
      "            arr[i] = undefined; // dbl check... fires error if still prop-set\n" +
      "            delete arr[i];\n" +
      "         }\n" +
      "      }\n" +
      "      for(var i=0;i < arr.length; i++) {\n" +
      "         if (i in arr)\n" +
      "            _destroy(i);\n" +
      "      }\n" +
      "      while(i in arr) {\n" +
      "         GLM.$DEBUG && GLM.$outer.console.debug('$destroy', this.name, i);\n" +
      "         _destroy(i++);\n" +
      "      }\n" +
      "      if (isArray)\n" +
      "         arr.length = 0;\n" +
      "   }\n" +
      "})\n" +
      "(this.arr, oldlen);\n" +
      "   // cleanup\n" +
      "   var arr = this.arr = this['->'] = container;\n" +
      "   \n" +
      "   // add convenience methods to pseudo-Array containers\n" +
      "   if (!Array.isArray(arr)) {\n" +
      "(function(arr) {\n" +
      "   arr.toJSON = " +
      "(function() { return this.slice(0); })\n" +
      "   'forEach,map,slice,filter,join,reduce'.split(',')\n" +
      "      .forEach(function(k) { arr[k] = Array.prototype[k]; });\n" +
      "   return arr;\n" +
      "})\n" +
      "(arr);\n" +
      "   }\n" +
      "   \n" +
      "   var cl = this.componentLength;\n" +
      "   if (!cl) throw new GLM.GLMJSError('no componentLength!?'+Object.keys(this));\n" +
      "   var last = ele.buffer.byteLength;\n" +
      "   var thiz = this;\n" +
      "   for(var i=0; i < n; i++) {\n" +
      "      var off = offset + i*stride;\n" +
      "      var next = off + this.glmtype.BYTES_PER_ELEMENT;//offset + (i+1)*stride;\n" +
      "      function dbg() {\n" +
      "         kv.i = i; kv.next = next; kv.last = last; kv.offset = kv.offset || offset; kv.stride = kv.stride || stride;\n" +
      "         return JSON.stringify(kv);//{i:i, eleO: ele.byteOffset, stride: stride, offset:offset, next:next, last:last});\n" +
      "      }\n" +
      "      if (off > last)\n" +
      "         throw new Error('['+i+'] off '+off+' > last '+last+' '+dbg());\n" +
      "      if (next > last)\n" +
      "         throw new Error('['+i+'] next '+next+' > last '+last+' '+dbg());\n" +
      "      \n" +
      "      arr[i] = null;\n" +
      "      var make_ti = function(ele,off) {\n" +
      "         ///if (!ele) { throw new Error('!ele ' + (+new Date())); onmessage({stop:1}); }\n" +
      "         var ret = new vec(new typearray(ele.buffer,off,cl));\n" +
      "         if (dynamic) // for detecting underlying .elements changes..\n" +
      "         Object.defineProperty(ret, '$elements', { value: ele });\n" +
      "         return ret;\n" +
      "      };\n" +
      "      var ti = make_ti(ele,off);\n" +
      "      \n" +
      "      if (!bSetters && !dynamic) {\n" +
      "         // read-only array elements\n" +
      "         arr[i] = ti;\n" +
      "      } else {\n" +
      "         // update-able array elements\n" +
      "         (function(ti,i,off) {\n" +
      "             Object.defineProperty(\n" +
      "                arr, i,\n" +
      "                {\n" +
      "                   enumerable: true,\n" +
      "                   configurable: true,\n" +
      "                   get: dynamic ?\n" +
      "                      function() {\n" +
      "                         if (ti.$elements !== thiz.elements) {\n" +
      "                            GLM.$log('dynoget rebinding ti',i,off,ti.$elements === thiz.elements);\n" +
      "                            ti = make_ti(thiz.elements,off);\n" +
      "                         }\n" +
      "                         return ti;\n" +
      "                      } :\n" +
      "                      function() { return ti; },\n" +
      "                   set: bSetters && (\n" +
      "                      dynamic ?\n" +
      "                         function(v) {\n" +
      "                            GLM.$log('dynoset',i,off,ti.$elements === thiz.elements);\n" +
      "                            if (ti.$elements !== thiz.elements) {\n" +
      "                               GLM.$log('dynoset rebinding ti',i,off,ti.$elements === thiz.elements);\n" +
      "                               ti = make_ti(thiz.elements,off);\n" +
      "                            }\n" +
      "                            return ti.copy(v);\n" +
      "                         } :\n" +
      "                         function(v,_) {\n" +
      "                            //console.warn('setter' + JSON.stringify({i:i,ti:ti,v:v},0,2));\n" +
      "                            return ti.copy(v);\n" +
      "                         }) || undefined\n" +
      "                });\n" +
      "          })(ti,i,off);\n" +
      "      }\n" +
      "   }\n" +
      "   return this;\n" +
      "})\n" +
      "(_kv);\n" +
      "   return this;\n" +
      "})\n" +
      "(this._typed_concat(this.elements, elements));\n" +
      "}\n",
      _set: "function(elements) {\n" +
      "   if (elements instanceof this.constructor)\n" +
      "      elements = new this.typearray(elements.elements);\n" +
      "   if (!(elements instanceof this.typearray))\n" +
      "      throw new GLM.GLMJSError('unsupported argtype to $GLMVector._set '+(elements&&elements.constructor));\n" +
      "   GLM.$DEBUG && GLM.$outer.console.debug('$GLMVector.prototype.set...' +\n" +
      "                'this.elements:'+[this.elements&&this.elements.constructor.name,\n" +
      "                 this.elements&&this.elements.length]+\n" +
      "                'elements:'+[elements.constructor.name,\n" +
      "                 elements.length]);\n" +
      "   var _kv = this._kv;\n" +
      "   this._kv = undefined;\n" +
      "   this.elements = elements;\n" +
      "   if (this.elements !== elements)\n" +
      "      throw new GLM.GLMJSError('err with .elements: '+ [this.glmtype.prototype.$type, this.elements,elements]);\n" +
      "   if (_kv)\n" +
      "(function(kv, oldlen) {\n" +
      "   var vec = this.glmtype;\n" +
      "   var typearray = this.typearray;\n" +
      "   var n = this.length;\n" +
      "   this._kv = kv;\n" +
      "   var stride = kv.stride || this.glmtype.BYTES_PER_ELEMENT,\n" +
      "   offset = kv.offset || this.elements.byteOffset,\n" +
      "   ele = kv.elements || this.elements,\n" +
      "   container = kv.container || this.arr || [],\n" +
      "   bSetters = kv.setters || false,\n" +
      "   dynamic = kv.dynamic || false;\n" +
      "   \n" +
      "   if (container === 'self')\n" +
      "      container = this;\n" +
      "   //console.warn('ele',typeof ele,ele, this.componentLength);\n" +
      "   \n" +
      "   if (!ele)\n" +
      "      throw new GLMJSError('GLMVector._setup - neither kv.elements nor this.elements...');\n" +
      "   \n" +
      "(function(arr) {\n" +
      "   if (arr) {\n" +
      "      var isArray = Array.isArray(arr);\n" +
      "      function _destroy(i) {\n" +
      "         Object.defineProperty(arr, i, { enumerable: true, configurable: true, value: undefined });\n" +
      "         delete arr[i];\n" +
      "         if (!isArray) {\n" +
      "            arr[i] = undefined; // dbl check... fires error if still prop-set\n" +
      "            delete arr[i];\n" +
      "         }\n" +
      "      }\n" +
      "      for(var i=0;i < arr.length; i++) {\n" +
      "         if (i in arr)\n" +
      "            _destroy(i);\n" +
      "      }\n" +
      "      while(i in arr) {\n" +
      "         GLM.$DEBUG && GLM.$outer.console.debug('$destroy', this.name, i);\n" +
      "         _destroy(i++);\n" +
      "      }\n" +
      "      if (isArray)\n" +
      "         arr.length = 0;\n" +
      "   }\n" +
      "})\n" +
      "(this.arr, oldlen);\n" +
      "   // cleanup\n" +
      "   var arr = this.arr = this['->'] = container;\n" +
      "   \n" +
      "   // add convenience methods to pseudo-Array containers\n" +
      "   if (!Array.isArray(arr)) {\n" +
      "(function(arr) {\n" +
      "   arr.toJSON = " +
      "(function() { return this.slice(0); })\n" +
      "   'forEach,map,slice,filter,join,reduce'.split(',')\n" +
      "      .forEach(function(k) { arr[k] = Array.prototype[k]; });\n" +
      "   return arr;\n" +
      "})\n" +
      "(arr);\n" +
      "   }\n" +
      "   \n" +
      "   var cl = this.componentLength;\n" +
      "   if (!cl) throw new GLM.GLMJSError('no componentLength!?'+Object.keys(this));\n" +
      "   var last = ele.buffer.byteLength;\n" +
      "   var thiz = this;\n" +
      "   for(var i=0; i < n; i++) {\n" +
      "      var off = offset + i*stride;\n" +
      "      var next = off + this.glmtype.BYTES_PER_ELEMENT;//offset + (i+1)*stride;\n" +
      "      function dbg() {\n" +
      "         kv.i = i; kv.next = next; kv.last = last; kv.offset = kv.offset || offset; kv.stride = kv.stride || stride;\n" +
      "         return JSON.stringify(kv);//{i:i, eleO: ele.byteOffset, stride: stride, offset:offset, next:next, last:last});\n" +
      "      }\n" +
      "      if (off > last)\n" +
      "         throw new Error('['+i+'] off '+off+' > last '+last+' '+dbg());\n" +
      "      if (next > last)\n" +
      "         throw new Error('['+i+'] next '+next+' > last '+last+' '+dbg());\n" +
      "      \n" +
      "      arr[i] = null;\n" +
      "      var make_ti = function(ele,off) {\n" +
      "         ///if (!ele) { throw new Error('!ele ' + (+new Date())); onmessage({stop:1}); }\n" +
      "         var ret = new vec(new typearray(ele.buffer,off,cl));\n" +
      "         if (dynamic) // for detecting underlying .elements changes..\n" +
      "         Object.defineProperty(ret, '$elements', { value: ele });\n" +
      "         return ret;\n" +
      "      };\n" +
      "      var ti = make_ti(ele,off);\n" +
      "      \n" +
      "      if (!bSetters && !dynamic) {\n" +
      "         // read-only array elements\n" +
      "         arr[i] = ti;\n" +
      "      } else {\n" +
      "         // update-able array elements\n" +
      "         (function(ti,i,off) {\n" +
      "             Object.defineProperty(\n" +
      "                arr, i,\n" +
      "                {\n" +
      "                   enumerable: true,\n" +
      "                   configurable: true,\n" +
      "                   get: dynamic ?\n" +
      "                      function() {\n" +
      "                         if (ti.$elements !== thiz.elements) {\n" +
      "                            GLM.$log('dynoget rebinding ti',i,off,ti.$elements === thiz.elements);\n" +
      "                            ti = make_ti(thiz.elements,off);\n" +
      "                         }\n" +
      "                         return ti;\n" +
      "                      } :\n" +
      "                      function() { return ti; },\n" +
      "                   set: bSetters && (\n" +
      "                      dynamic ?\n" +
      "                         function(v) {\n" +
      "                            GLM.$log('dynoset',i,off,ti.$elements === thiz.elements);\n" +
      "                            if (ti.$elements !== thiz.elements) {\n" +
      "                               GLM.$log('dynoset rebinding ti',i,off,ti.$elements === thiz.elements);\n" +
      "                               ti = make_ti(thiz.elements,off);\n" +
      "                            }\n" +
      "                            return ti.copy(v);\n" +
      "                         } :\n" +
      "                         function(v,_) {\n" +
      "                            //console.warn('setter' + JSON.stringify({i:i,ti:ti,v:v},0,2));\n" +
      "                            return ti.copy(v);\n" +
      "                         }) || undefined\n" +
      "                });\n" +
      "          })(ti,i,off);\n" +
      "      }\n" +
      "   }\n" +
      "   return this;\n" +
      "})\n" +
      "(_kv);\n" +
      "   return this;\n" +
      "}\n",
      arrayize: "function(bSetters,bDynamic) {\n" +
      "   return " +
      "(function(kv, oldlen) {\n" +
      "   var vec = this.glmtype;\n" +
      "   var typearray = this.typearray;\n" +
      "   var n = this.length;\n" +
      "   this._kv = kv;\n" +
      "   var stride = kv.stride || this.glmtype.BYTES_PER_ELEMENT,\n" +
      "   offset = kv.offset || this.elements.byteOffset,\n" +
      "   ele = kv.elements || this.elements,\n" +
      "   container = kv.container || this.arr || [],\n" +
      "   bSetters = kv.setters || false,\n" +
      "   dynamic = kv.dynamic || false;\n" +
      "   \n" +
      "   if (container === 'self')\n" +
      "      container = this;\n" +
      "   //console.warn('ele',typeof ele,ele, this.componentLength);\n" +
      "   \n" +
      "   if (!ele)\n" +
      "      throw new GLMJSError('GLMVector._setup - neither kv.elements nor this.elements...');\n" +
      "   \n" +
      "(function(arr) {\n" +
      "   if (arr) {\n" +
      "      var isArray = Array.isArray(arr);\n" +
      "      function _destroy(i) {\n" +
      "         Object.defineProperty(arr, i, { enumerable: true, configurable: true, value: undefined });\n" +
      "         delete arr[i];\n" +
      "         if (!isArray) {\n" +
      "            arr[i] = undefined; // dbl check... fires error if still prop-set\n" +
      "            delete arr[i];\n" +
      "         }\n" +
      "      }\n" +
      "      for(var i=0;i < arr.length; i++) {\n" +
      "         if (i in arr)\n" +
      "            _destroy(i);\n" +
      "      }\n" +
      "      while(i in arr) {\n" +
      "         GLM.$DEBUG && GLM.$outer.console.debug('$destroy', this.name, i);\n" +
      "         _destroy(i++);\n" +
      "      }\n" +
      "      if (isArray)\n" +
      "         arr.length = 0;\n" +
      "   }\n" +
      "})\n" +
      "(this.arr, oldlen);\n" +
      "   // cleanup\n" +
      "   var arr = this.arr = this['->'] = container;\n" +
      "   \n" +
      "   // add convenience methods to pseudo-Array containers\n" +
      "   if (!Array.isArray(arr)) {\n" +
      "(function(arr) {\n" +
      "   arr.toJSON = " +
      "(function() { return this.slice(0); })\n" +
      "   'forEach,map,slice,filter,join,reduce'.split(',')\n" +
      "      .forEach(function(k) { arr[k] = Array.prototype[k]; });\n" +
      "   return arr;\n" +
      "})\n" +
      "(arr);\n" +
      "   }\n" +
      "   \n" +
      "   var cl = this.componentLength;\n" +
      "   if (!cl) throw new GLM.GLMJSError('no componentLength!?'+Object.keys(this));\n" +
      "   var last = ele.buffer.byteLength;\n" +
      "   var thiz = this;\n" +
      "   for(var i=0; i < n; i++) {\n" +
      "      var off = offset + i*stride;\n" +
      "      var next = off + this.glmtype.BYTES_PER_ELEMENT;//offset + (i+1)*stride;\n" +
      "      function dbg() {\n" +
      "         kv.i = i; kv.next = next; kv.last = last; kv.offset = kv.offset || offset; kv.stride = kv.stride || stride;\n" +
      "         return JSON.stringify(kv);//{i:i, eleO: ele.byteOffset, stride: stride, offset:offset, next:next, last:last});\n" +
      "      }\n" +
      "      if (off > last)\n" +
      "         throw new Error('['+i+'] off '+off+' > last '+last+' '+dbg());\n" +
      "      if (next > last)\n" +
      "         throw new Error('['+i+'] next '+next+' > last '+last+' '+dbg());\n" +
      "      \n" +
      "      arr[i] = null;\n" +
      "      var make_ti = function(ele,off) {\n" +
      "         ///if (!ele) { throw new Error('!ele ' + (+new Date())); onmessage({stop:1}); }\n" +
      "         var ret = new vec(new typearray(ele.buffer,off,cl));\n" +
      "         if (dynamic) // for detecting underlying .elements changes..\n" +
      "         Object.defineProperty(ret, '$elements', { value: ele });\n" +
      "         return ret;\n" +
      "      };\n" +
      "      var ti = make_ti(ele,off);\n" +
      "      \n" +
      "      if (!bSetters && !dynamic) {\n" +
      "         // read-only array elements\n" +
      "         arr[i] = ti;\n" +
      "      } else {\n" +
      "         // update-able array elements\n" +
      "         (function(ti,i,off) {\n" +
      "             Object.defineProperty(\n" +
      "                arr, i,\n" +
      "                {\n" +
      "                   enumerable: true,\n" +
      "                   configurable: true,\n" +
      "                   get: dynamic ?\n" +
      "                      function() {\n" +
      "                         if (ti.$elements !== thiz.elements) {\n" +
      "                            GLM.$log('dynoget rebinding ti',i,off,ti.$elements === thiz.elements);\n" +
      "                            ti = make_ti(thiz.elements,off);\n" +
      "                         }\n" +
      "                         return ti;\n" +
      "                      } :\n" +
      "                      function() { return ti; },\n" +
      "                   set: bSetters && (\n" +
      "                      dynamic ?\n" +
      "                         function(v) {\n" +
      "                            GLM.$log('dynoset',i,off,ti.$elements === thiz.elements);\n" +
      "                            if (ti.$elements !== thiz.elements) {\n" +
      "                               GLM.$log('dynoset rebinding ti',i,off,ti.$elements === thiz.elements);\n" +
      "                               ti = make_ti(thiz.elements,off);\n" +
      "                            }\n" +
      "                            return ti.copy(v);\n" +
      "                         } :\n" +
      "                         function(v,_) {\n" +
      "                            //console.warn('setter' + JSON.stringify({i:i,ti:ti,v:v},0,2));\n" +
      "                            return ti.copy(v);\n" +
      "                         }) || undefined\n" +
      "                });\n" +
      "          })(ti,i,off);\n" +
      "      }\n" +
      "   }\n" +
      "   return this;\n" +
      "})\n" +
      "({\n" +
      "                         //stride: this.glmtype.BYTES_PER_ELEMENT,\n" +
      "                         //offset: ele.byteOffset,\n" +
      "                         //ele: this.elements,\n" +
      "                         //container: [],\n" +
      "                         dynamic: bDynamic,\n" +
      "                         setters: bSetters\n" +
      "                      }, this.length);\n" +
      "}\n",
      $destroy: "function(arr) {\n" +
      "   if (arr) {\n" +
      "      var isArray = Array.isArray(arr);\n" +
      "      function _destroy(i) {\n" +
      "         Object.defineProperty(arr, i, { enumerable: true, configurable: true, value: undefined });\n" +
      "         delete arr[i];\n" +
      "         if (!isArray) {\n" +
      "            arr[i] = undefined; // dbl check... fires error if still prop-set\n" +
      "            delete arr[i];\n" +
      "         }\n" +
      "      }\n" +
      "      for(var i=0;i < arr.length; i++) {\n" +
      "         if (i in arr)\n" +
      "            _destroy(i);\n" +
      "      }\n" +
      "      while(i in arr) {\n" +
      "         GLM.$DEBUG && GLM.$outer.console.debug('$destroy', this.name, i);\n" +
      "         _destroy(i++);\n" +
      "      }\n" +
      "      if (isArray)\n" +
      "         arr.length = 0;\n" +
      "   }\n" +
      "}\n",
      _arrlike_toJSON: "function() { return this.slice(0); }\n",
      _mixinArray: "function(arr) {\n" +
      "   arr.toJSON = " +
      "(function() { return this.slice(0); })\n" +
      "   'forEach,map,slice,filter,join,reduce'.split(',')\n" +
      "      .forEach(function(k) { arr[k] = Array.prototype[k]; });\n" +
      "   return arr;\n" +
      "}\n",
      _setup: "function(kv, oldlen) {\n" +
      "   var vec = this.glmtype;\n" +
      "   var typearray = this.typearray;\n" +
      "   var n = this.length;\n" +
      "   this._kv = kv;\n" +
      "   var stride = kv.stride || this.glmtype.BYTES_PER_ELEMENT,\n" +
      "   offset = kv.offset || this.elements.byteOffset,\n" +
      "   ele = kv.elements || this.elements,\n" +
      "   container = kv.container || this.arr || [],\n" +
      "   bSetters = kv.setters || false,\n" +
      "   dynamic = kv.dynamic || false;\n" +
      "   \n" +
      "   if (container === 'self')\n" +
      "      container = this;\n" +
      "   //console.warn('ele',typeof ele,ele, this.componentLength);\n" +
      "   \n" +
      "   if (!ele)\n" +
      "      throw new GLMJSError('GLMVector._setup - neither kv.elements nor this.elements...');\n" +
      "   \n" +
      "(function(arr) {\n" +
      "   if (arr) {\n" +
      "      var isArray = Array.isArray(arr);\n" +
      "      function _destroy(i) {\n" +
      "         Object.defineProperty(arr, i, { enumerable: true, configurable: true, value: undefined });\n" +
      "         delete arr[i];\n" +
      "         if (!isArray) {\n" +
      "            arr[i] = undefined; // dbl check... fires error if still prop-set\n" +
      "            delete arr[i];\n" +
      "         }\n" +
      "      }\n" +
      "      for(var i=0;i < arr.length; i++) {\n" +
      "         if (i in arr)\n" +
      "            _destroy(i);\n" +
      "      }\n" +
      "      while(i in arr) {\n" +
      "         GLM.$DEBUG && GLM.$outer.console.debug('$destroy', this.name, i);\n" +
      "         _destroy(i++);\n" +
      "      }\n" +
      "      if (isArray)\n" +
      "         arr.length = 0;\n" +
      "   }\n" +
      "})\n" +
      "(this.arr, oldlen);\n" +
      "   // cleanup\n" +
      "   var arr = this.arr = this['->'] = container;\n" +
      "   \n" +
      "   // add convenience methods to pseudo-Array containers\n" +
      "   if (!Array.isArray(arr)) {\n" +
      "(function(arr) {\n" +
      "   arr.toJSON = " +
      "(function() { return this.slice(0); })\n" +
      "   'forEach,map,slice,filter,join,reduce'.split(',')\n" +
      "      .forEach(function(k) { arr[k] = Array.prototype[k]; });\n" +
      "   return arr;\n" +
      "})\n" +
      "(arr);\n" +
      "   }\n" +
      "   \n" +
      "   var cl = this.componentLength;\n" +
      "   if (!cl) throw new GLM.GLMJSError('no componentLength!?'+Object.keys(this));\n" +
      "   var last = ele.buffer.byteLength;\n" +
      "   var thiz = this;\n" +
      "   for(var i=0; i < n; i++) {\n" +
      "      var off = offset + i*stride;\n" +
      "      var next = off + this.glmtype.BYTES_PER_ELEMENT;//offset + (i+1)*stride;\n" +
      "      function dbg() {\n" +
      "         kv.i = i; kv.next = next; kv.last = last; kv.offset = kv.offset || offset; kv.stride = kv.stride || stride;\n" +
      "         return JSON.stringify(kv);//{i:i, eleO: ele.byteOffset, stride: stride, offset:offset, next:next, last:last});\n" +
      "      }\n" +
      "      if (off > last)\n" +
      "         throw new Error('['+i+'] off '+off+' > last '+last+' '+dbg());\n" +
      "      if (next > last)\n" +
      "         throw new Error('['+i+'] next '+next+' > last '+last+' '+dbg());\n" +
      "      \n" +
      "      arr[i] = null;\n" +
      "      var make_ti = function(ele,off) {\n" +
      "         ///if (!ele) { throw new Error('!ele ' + (+new Date())); onmessage({stop:1}); }\n" +
      "         var ret = new vec(new typearray(ele.buffer,off,cl));\n" +
      "         if (dynamic) // for detecting underlying .elements changes..\n" +
      "         Object.defineProperty(ret, '$elements', { value: ele });\n" +
      "         return ret;\n" +
      "      };\n" +
      "      var ti = make_ti(ele,off);\n" +
      "      \n" +
      "      if (!bSetters && !dynamic) {\n" +
      "         // read-only array elements\n" +
      "         arr[i] = ti;\n" +
      "      } else {\n" +
      "         // update-able array elements\n" +
      "         (function(ti,i,off) {\n" +
      "             Object.defineProperty(\n" +
      "                arr, i,\n" +
      "                {\n" +
      "                   enumerable: true,\n" +
      "                   configurable: true,\n" +
      "                   get: dynamic ?\n" +
      "                      function() {\n" +
      "                         if (ti.$elements !== thiz.elements) {\n" +
      "                            GLM.$log('dynoget rebinding ti',i,off,ti.$elements === thiz.elements);\n" +
      "                            ti = make_ti(thiz.elements,off);\n" +
      "                         }\n" +
      "                         return ti;\n" +
      "                      } :\n" +
      "                      function() { return ti; },\n" +
      "                   set: bSetters && (\n" +
      "                      dynamic ?\n" +
      "                         function(v) {\n" +
      "                            GLM.$log('dynoset',i,off,ti.$elements === thiz.elements);\n" +
      "                            if (ti.$elements !== thiz.elements) {\n" +
      "                               GLM.$log('dynoset rebinding ti',i,off,ti.$elements === thiz.elements);\n" +
      "                               ti = make_ti(thiz.elements,off);\n" +
      "                            }\n" +
      "                            return ti.copy(v);\n" +
      "                         } :\n" +
      "                         function(v,_) {\n" +
      "                            //console.warn('setter' + JSON.stringify({i:i,ti:ti,v:v},0,2));\n" +
      "                            return ti.copy(v);\n" +
      "                         }) || undefined\n" +
      "                });\n" +
      "          })(ti,i,off);\n" +
      "      }\n" +
      "   }\n" +
      "   return this;\n" +
      "}\n",
      // DATA is arg is a set of [typearray(),typearray()] buffers (eg: socket.io buffers)
      setFromBuffers: "function(DATA) {\n" +
      "   var fa = this.elements;\n" +
      "   var off = 0;\n" +
      "   var fl = fa.length;\n" +
      "   DATA.forEach(\n" +
      "      function(seg) {\n" +
      "         var sl = seg.length;\n" +
      "         if (off+sl > fa.length) {\n" +
      "            var mseg = Math.min(\n" +
      "               fa.length - off,\n" +
      "               seg.length);\n" +
      "            if (mseg <= 0) {\n" +
      "               return;\n" +
      "            } else {\n" +
      "               seg = glm.$subarray(seg,0,mseg);\n" +
      "               sl = seg.length;\n" +
      "            }\n" +
      "         }\n" +
      "         \n" +
      "         if (off+sl > fa.length)\n" +
      "            throw new glm.GLMJSError('$vectorType.fromBuffers mismatch '+[off,sl,fa.length]);\n" +
      "         \n" +
      "         fa.set(seg,off);\n" +
      "         off += seg.length;\n" +
      "      });\n" +
      "   return off;\n" +
      "}\n",
      setFromPointer: "function(ptr) {\n" +
      "   if(!(ptr instanceof GLM.$outer.ArrayBuffer))\n" +
      "      throw new glm.GLMJSError('unsupported argtype '+[typeof ptr]+' - $GLMVector.setFromPointer');\n" +
      "   return " +
      "(function(elements) {\n" +
      "   if (elements instanceof this.constructor)\n" +
      "      elements = new this.typearray(elements.elements);\n" +
      "   if (!(elements instanceof this.typearray))\n" +
      "      throw new GLM.GLMJSError('unsupported argtype to $GLMVector._set '+(elements&&elements.constructor));\n" +
      "   GLM.$DEBUG && GLM.$outer.console.debug('$GLMVector.prototype.set...' +\n" +
      "                'this.elements:'+[this.elements&&this.elements.constructor.name,\n" +
      "                 this.elements&&this.elements.length]+\n" +
      "                'elements:'+[elements.constructor.name,\n" +
      "                 elements.length]);\n" +
      "   var _kv = this._kv;\n" +
      "   this._kv = undefined;\n" +
      "   this.elements = elements;\n" +
      "   if (this.elements !== elements)\n" +
      "      throw new GLM.GLMJSError('err with .elements: '+ [this.glmtype.prototype.$type, this.elements,elements]);\n" +
      "   if (_kv)\n" +
      "(function(kv, oldlen) {\n" +
      "   var vec = this.glmtype;\n" +
      "   var typearray = this.typearray;\n" +
      "   var n = this.length;\n" +
      "   this._kv = kv;\n" +
      "   var stride = kv.stride || this.glmtype.BYTES_PER_ELEMENT,\n" +
      "   offset = kv.offset || this.elements.byteOffset,\n" +
      "   ele = kv.elements || this.elements,\n" +
      "   container = kv.container || this.arr || [],\n" +
      "   bSetters = kv.setters || false,\n" +
      "   dynamic = kv.dynamic || false;\n" +
      "   \n" +
      "   if (container === 'self')\n" +
      "      container = this;\n" +
      "   //console.warn('ele',typeof ele,ele, this.componentLength);\n" +
      "   \n" +
      "   if (!ele)\n" +
      "      throw new GLMJSError('GLMVector._setup - neither kv.elements nor this.elements...');\n" +
      "   \n" +
      "(function(arr) {\n" +
      "   if (arr) {\n" +
      "      var isArray = Array.isArray(arr);\n" +
      "      function _destroy(i) {\n" +
      "         Object.defineProperty(arr, i, { enumerable: true, configurable: true, value: undefined });\n" +
      "         delete arr[i];\n" +
      "         if (!isArray) {\n" +
      "            arr[i] = undefined; // dbl check... fires error if still prop-set\n" +
      "            delete arr[i];\n" +
      "         }\n" +
      "      }\n" +
      "      for(var i=0;i < arr.length; i++) {\n" +
      "         if (i in arr)\n" +
      "            _destroy(i);\n" +
      "      }\n" +
      "      while(i in arr) {\n" +
      "         GLM.$DEBUG && GLM.$outer.console.debug('$destroy', this.name, i);\n" +
      "         _destroy(i++);\n" +
      "      }\n" +
      "      if (isArray)\n" +
      "         arr.length = 0;\n" +
      "   }\n" +
      "})\n" +
      "(this.arr, oldlen);\n" +
      "   // cleanup\n" +
      "   var arr = this.arr = this['->'] = container;\n" +
      "   \n" +
      "   // add convenience methods to pseudo-Array containers\n" +
      "   if (!Array.isArray(arr)) {\n" +
      "(function(arr) {\n" +
      "   arr.toJSON = " +
      "(function() { return this.slice(0); })\n" +
      "   'forEach,map,slice,filter,join,reduce'.split(',')\n" +
      "      .forEach(function(k) { arr[k] = Array.prototype[k]; });\n" +
      "   return arr;\n" +
      "})\n" +
      "(arr);\n" +
      "   }\n" +
      "   \n" +
      "   var cl = this.componentLength;\n" +
      "   if (!cl) throw new GLM.GLMJSError('no componentLength!?'+Object.keys(this));\n" +
      "   var last = ele.buffer.byteLength;\n" +
      "   var thiz = this;\n" +
      "   for(var i=0; i < n; i++) {\n" +
      "      var off = offset + i*stride;\n" +
      "      var next = off + this.glmtype.BYTES_PER_ELEMENT;//offset + (i+1)*stride;\n" +
      "      function dbg() {\n" +
      "         kv.i = i; kv.next = next; kv.last = last; kv.offset = kv.offset || offset; kv.stride = kv.stride || stride;\n" +
      "         return JSON.stringify(kv);//{i:i, eleO: ele.byteOffset, stride: stride, offset:offset, next:next, last:last});\n" +
      "      }\n" +
      "      if (off > last)\n" +
      "         throw new Error('['+i+'] off '+off+' > last '+last+' '+dbg());\n" +
      "      if (next > last)\n" +
      "         throw new Error('['+i+'] next '+next+' > last '+last+' '+dbg());\n" +
      "      \n" +
      "      arr[i] = null;\n" +
      "      var make_ti = function(ele,off) {\n" +
      "         ///if (!ele) { throw new Error('!ele ' + (+new Date())); onmessage({stop:1}); }\n" +
      "         var ret = new vec(new typearray(ele.buffer,off,cl));\n" +
      "         if (dynamic) // for detecting underlying .elements changes..\n" +
      "         Object.defineProperty(ret, '$elements', { value: ele });\n" +
      "         return ret;\n" +
      "      };\n" +
      "      var ti = make_ti(ele,off);\n" +
      "      \n" +
      "      if (!bSetters && !dynamic) {\n" +
      "         // read-only array elements\n" +
      "         arr[i] = ti;\n" +
      "      } else {\n" +
      "         // update-able array elements\n" +
      "         (function(ti,i,off) {\n" +
      "             Object.defineProperty(\n" +
      "                arr, i,\n" +
      "                {\n" +
      "                   enumerable: true,\n" +
      "                   configurable: true,\n" +
      "                   get: dynamic ?\n" +
      "                      function() {\n" +
      "                         if (ti.$elements !== thiz.elements) {\n" +
      "                            GLM.$log('dynoget rebinding ti',i,off,ti.$elements === thiz.elements);\n" +
      "                            ti = make_ti(thiz.elements,off);\n" +
      "                         }\n" +
      "                         return ti;\n" +
      "                      } :\n" +
      "                      function() { return ti; },\n" +
      "                   set: bSetters && (\n" +
      "                      dynamic ?\n" +
      "                         function(v) {\n" +
      "                            GLM.$log('dynoset',i,off,ti.$elements === thiz.elements);\n" +
      "                            if (ti.$elements !== thiz.elements) {\n" +
      "                               GLM.$log('dynoset rebinding ti',i,off,ti.$elements === thiz.elements);\n" +
      "                               ti = make_ti(thiz.elements,off);\n" +
      "                            }\n" +
      "                            return ti.copy(v);\n" +
      "                         } :\n" +
      "                         function(v,_) {\n" +
      "                            //console.warn('setter' + JSON.stringify({i:i,ti:ti,v:v},0,2));\n" +
      "                            return ti.copy(v);\n" +
      "                         }) || undefined\n" +
      "                });\n" +
      "          })(ti,i,off);\n" +
      "      }\n" +
      "   }\n" +
      "   return this;\n" +
      "})\n" +
      "(_kv);\n" +
      "   return this;\n" +
      "})\n" +
      "(new this.typearray(ptr));\n" +
      "}\n"
   });

// Object.defineProperty(
//     $GLMVector.prototype, 'base64',
//     {
//         get: function() {
//             return GLM.$to_base64(this);
//         },
//         set: function(a) {
//             return this.elements.set(new this.typearray(GLM.$b64.decode(a)));
//         }
//     });



