THREE.UniformsLib.lights.pointLights.properties.animated = {};

//https://stackoverflow.com/a/47424292/4958457

//Fix the phong material to ignore light shading if a lightmap is present so that we can have shadows on level geometry
THREE.ShaderLib[ 'phong' ].fragmentShader = THREE.ShaderLib[ 'phong' ].fragmentShader.replace(

  `vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;`,

  `
  #ifndef AURORA
    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
  #else
    #ifdef USE_LIGHTMAP
      reflectedLight.indirectDiffuse = vec3(0.0, 0.0, 0.0);
      reflectedLight.indirectDiffuse += PI * texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;
      reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );
      vec3 outgoingLight = (reflectedLight.indirectDiffuse); // shadow intensity hardwired to 0.5 here
    #else
      //reflectedLight.indirectDiffuse = vec3(diffuseColor.rgb);
      vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
    #endif
  #endif
  
  #ifdef IGNORE_LIGHTING
    outgoingLight = vec3(diffuseColor.rgb);
  #endif`

);

//Fixing the envmap shader to to mix acording to the Alpha Channel of the base texture
THREE.ShaderChunk['envmap_fragment'] = `
#ifdef USE_ENVMAP
  #if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )
    vec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );
    vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
    #ifdef ENVMAP_MODE_REFLECTION
      vec3 reflectVec = reflect( cameraToVertex, worldNormal );
    #else
      vec3 reflectVec = refract( cameraToVertex, worldNormal, refractionRatio );
    #endif
  #else
    vec3 reflectVec = vReflect;
  #endif
  #ifdef ENVMAP_TYPE_CUBE
    vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
  #elif defined( ENVMAP_TYPE_EQUIREC )
    vec2 sampleUV;
    reflectVec = normalize( reflectVec );
    sampleUV.y = asin( clamp( reflectVec.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
    sampleUV.x = atan( reflectVec.z, reflectVec.x ) * RECIPROCAL_PI2 + 0.5;
    vec4 envColor = texture2D( envMap, sampleUV );
  #elif defined( ENVMAP_TYPE_SPHERE )
    reflectVec = normalize( reflectVec );
    vec3 reflectView = normalize( ( viewMatrix * vec4( reflectVec, 0.0 ) ).xyz + vec3( 0.0, 0.0, 1.0 ) );
    vec4 envColor = texture2D( envMap, reflectView.xy * 0.5 + 0.5 );
  #else
    vec4 envColor = vec4( 0.0 );
  #endif
  envColor = envMapTexelToLinear( envColor );
  #ifdef ENVMAP_BLENDING_MULTIPLY
    outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, (specularStrength * reflectivity) * (1.0 - diffuseColor.a) );
  #elif defined( ENVMAP_BLENDING_MIX )
    outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity * (1.0 - diffuseColor.a) );
  #elif defined( ENVMAP_BLENDING_ADD )
    outgoingLight += (envColor.xyz * specularStrength * reflectivity) * (1.0 - diffuseColor.a);
  #endif
#endif
`;


THREE.ShaderLib.aurora = {
  fragmentShader: `
  #define PHONG
  uniform vec3 diffuse;
  uniform vec3 emissive;
  uniform vec3 selfIllumColor;
  uniform vec3 tweakColor;
  uniform vec3 specular;
  uniform float shininess;
  uniform float opacity;
  uniform float time;
  #ifdef WATER
    varying vec2 vUvWater;
    uniform float waterAlpha;
  #endif
  #include <common>
  #include <packing>
  #include <dithering_pars_fragment>
  #include <color_pars_fragment>
  #include <uv_pars_fragment>
  #include <uv2_pars_fragment>
  #include <map_pars_fragment>
  #include <alphamap_pars_fragment>
  #include <aomap_pars_fragment>
  #include <lightmap_pars_fragment>
  #include <emissivemap_pars_fragment>
  #include <envmap_common_pars_fragment>
  #include <envmap_pars_fragment>
  #include <gradientmap_pars_fragment>
  #include <fog_pars_fragment>
  #include <bsdfs>
  
  uniform vec3 ambientLightColor;
  vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
    vec3 irradiance = ambientLightColor;
    #ifndef PHYSICALLY_CORRECT_LIGHTS
      irradiance *= PI;
    #endif
    return irradiance;
  }
  #if NUM_DIR_LIGHTS > 0
    struct DirectionalLight {
      vec3 direction;
      vec3 color;
      int shadow;
      float shadowBias;
      float shadowRadius;
      vec2 shadowMapSize;
    };
    uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
    void getDirectionalDirectLightIrradiance( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight directLight ) {
      directLight.color = directionalLight.color;
      directLight.direction = directionalLight.direction;
      directLight.visible = true;
    }
  #endif
  #if NUM_POINT_LIGHTS > 0
    struct PointLight {
      vec3 position;
      vec3 color;
      float distance;
      float decay;
      int shadow;
      float animated;
      float shadowBias;
      float shadowRadius;
      vec2 shadowMapSize;
      float shadowCameraNear;
      float shadowCameraFar;
    };
    uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
    void getPointDirectLightIrradiance( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight directLight ) {
      vec3 lVector = pointLight.position - geometry.position;
      directLight.direction = normalize( lVector );
      float lightDistance = length( lVector );
      directLight.color = pointLight.color;
      directLight.color *= punctualLightIntensityToIrradianceFactor( lightDistance, pointLight.distance, pointLight.decay );
      directLight.visible = ( directLight.color != vec3( 0.0 ) );
    }
  #endif
  #if NUM_SPOT_LIGHTS > 0
    struct SpotLight {
      vec3 position;
      vec3 direction;
      vec3 color;
      float distance;
      float decay;
      float coneCos;
      float penumbraCos;
      int shadow;
      float shadowBias;
      float shadowRadius;
      vec2 shadowMapSize;
    };
    uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
    void getSpotDirectLightIrradiance( const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight directLight  ) {
      vec3 lVector = spotLight.position - geometry.position;
      directLight.direction = normalize( lVector );
      float lightDistance = length( lVector );
      float angleCos = dot( directLight.direction, spotLight.direction );
      if ( angleCos > spotLight.coneCos ) {
        float spotEffect = smoothstep( spotLight.coneCos, spotLight.penumbraCos, angleCos );
        directLight.color = spotLight.color;
        directLight.color *= spotEffect * punctualLightIntensityToIrradianceFactor( lightDistance, spotLight.distance, spotLight.decay );
        directLight.visible = true;
      } else {
        directLight.color = vec3( 0.0 );
        directLight.visible = false;
      }
    }
  #endif
  #if NUM_RECT_AREA_LIGHTS > 0
    struct RectAreaLight {
      vec3 color;
      vec3 position;
      vec3 halfWidth;
      vec3 halfHeight;
    };
    uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
    uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
  #endif
  #if NUM_HEMI_LIGHTS > 0
    struct HemisphereLight {
      vec3 direction;
      vec3 skyColor;
      vec3 groundColor;
    };
    uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
    vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in GeometricContext geometry ) {
      float dotNL = dot( geometry.normal, hemiLight.direction );
      float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
      vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
      #ifndef PHYSICALLY_CORRECT_LIGHTS
        irradiance *= PI;
      #endif
      return irradiance;
    }
  #endif

  #include <lights_phong_pars_fragment>
  #include <shadowmap_pars_fragment>
  #ifdef WATER
    #ifdef USE_BUMPMAP
      uniform sampler2D bumpMap;
      uniform float bumpScale;
      vec2 dHdxy_fwd() {
        vec2 dSTdx = dFdx( vUvWater );
        vec2 dSTdy = dFdy( vUvWater );
        float Hll = bumpScale * texture2D( bumpMap, vUvWater ).x;
        float dBx = bumpScale * texture2D( bumpMap, vUvWater + dSTdx ).x - Hll;
        float dBy = bumpScale * texture2D( bumpMap, vUvWater + dSTdy ).x - Hll;
        return vec2( dBx, dBy );
      }
      vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {
        vec3 vSigmaX = vec3( dFdx( surf_pos.x ), dFdx( surf_pos.y ), dFdx( surf_pos.z ) );
        vec3 vSigmaY = vec3( dFdy( surf_pos.x ), dFdy( surf_pos.y ), dFdy( surf_pos.z ) );
        vec3 vN = surf_norm;
        vec3 R1 = cross( vSigmaY, vN );
        vec3 R2 = cross( vN, vSigmaX );
        float fDet = dot( vSigmaX, R1 );
        fDet *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );
        vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
        return normalize( abs( fDet ) * surf_norm - vGrad );
      }
    #endif
  #else
    #include <bumpmap_pars_fragment>
  #endif
  #include <normalmap_pars_fragment>
  #include <specularmap_pars_fragment>
  #include <logdepthbuf_pars_fragment>
  #include <clipping_planes_pars_fragment>

  void RE_Direct_Anim( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, const in float amount, inout ReflectedLight reflectedLight ) {
    #ifdef TOON
      vec3 irradiance = getGradientIrradiance( geometry.normal, directLight.direction ) * directLight.color;
    #else
      float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
      vec3 irradiance = dotNL * directLight.color;
    #endif
    #ifndef PHYSICALLY_CORRECT_LIGHTS
      irradiance *= PI; // punctual light
    #endif
    reflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor ) * amount;
    reflectedLight.directSpecular += irradiance * BRDF_Specular_BlinnPhong( directLight, geometry, material.specularColor, material.specularShininess ) * material.specularStrength * amount;
  }

  vec4 lightMapTSLFix(const in vec4 lightMapColor){

    vec4 fixedColor = vec4(lightMapColor);
    if(fixedColor.w < 1.0){
      fixedColor.x = lightMapColor.x * fixedColor.w;
      fixedColor.y = lightMapColor.y * fixedColor.w;
      fixedColor.z = lightMapColor.z * fixedColor.w;
    }
    return (fixedColor);

  }

  //float rand(vec2 co) {
  //  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  //}

  vec2 uResolution = vec2(640.0, 480.0);


  void main() {
    #include <clipping_planes_fragment>
    vec4 diffuseColor = vec4( diffuse, opacity );
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    ReflectedLight animatedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    vec3 totalEmissiveRadiance = emissive;
    #include <logdepthbuf_fragment>
    #include <map_fragment>
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <specularmap_fragment>
    #include <normal_fragment_begin>
    #include <normal_fragment_maps>
    #include <emissivemap_fragment>
    // accumulation
    #include <lights_phong_fragment>
    GeometricContext geometry;
    geometry.position = - vViewPosition;
    geometry.normal = normal;
    geometry.viewDir = normalize( vViewPosition );
    IncidentLight directLight;
    #if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
      PointLight pointLight;
      #pragma unroll_loop
      for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
        pointLight = pointLights[ i ];
        getPointDirectLightIrradiance( pointLight, geometry, directLight );
        #ifdef USE_SHADOWMAP
          directLight.color *= all( bvec2( pointLight.shadow, directLight.visible ) ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
        #endif
        RE_Direct( directLight, geometry, material, reflectedLight );
        
        RE_Direct_Anim( directLight, geometry, material, pointLight.animated, animatedLight );
        //animatedLight += (directLight.color * pointLight.distance * pointLight.animated) * 0.1;
      }
    #endif
    #if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
      SpotLight spotLight;
      #pragma unroll_loop
      for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
        spotLight = spotLights[ i ];
        getSpotDirectLightIrradiance( spotLight, geometry, directLight );
        #ifdef USE_SHADOWMAP
        directLight.color *= all( bvec2( spotLight.shadow, directLight.visible ) ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
        #endif
        RE_Direct( directLight, geometry, material, reflectedLight );
      }
    #endif
    #if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
      DirectionalLight directionalLight;
      #pragma unroll_loop
      for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
        directionalLight = directionalLights[ i ];
        getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );
        #ifdef USE_SHADOWMAP
        directLight.color *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
        #endif
        RE_Direct( directLight, geometry, material, reflectedLight );
      }
    #endif
    #if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
      RectAreaLight rectAreaLight;
      #pragma unroll_loop
      for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
        rectAreaLight = rectAreaLights[ i ];
        RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );
      }
    #endif
    #if defined( RE_IndirectDiffuse )
      vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
      #if ( NUM_HEMI_LIGHTS > 0 )
        #pragma unroll_loop
        for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
          irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );
        }
      #endif
    #endif
    #if defined( RE_IndirectSpecular )
      vec3 radiance = vec3( 0.0 );
      vec3 clearCoatRadiance = vec3( 0.0 );
    #endif
    #include <lights_fragment_maps>
    #include <lights_fragment_end>
    // modulation
    #include <aomap_fragment>
    #ifndef AURORA
      vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
    #else
      #ifdef USE_LIGHTMAP
        reflectedLight.indirectDiffuse = vec3(0.0);
        reflectedLight.indirectDiffuse += PI * texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;
        reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );
        //vec3 outgoingLight = (reflectedLight.indirectDiffuse + animatedLight); // shadow intensity hardwired to 0.5 here

        vec3 outgoingLight = reflectedLight.indirectDiffuse + (((animatedLight.directDiffuse * 0.5) + animatedLight.indirectDiffuse + animatedLight.directSpecular + animatedLight.indirectSpecular + totalEmissiveRadiance));
      #else
        //reflectedLight.indirectDiffuse = vec3(diffuseColor.rgb);
        vec3 outgoingLight = (reflectedLight.directDiffuse * tweakColor) + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
      #endif
    #endif
    
    #ifdef IGNORE_LIGHTING
      //outgoingLight = vec3(diffuseColor.rgb + animatedLight);
      //mix(diffuseColor.rgb, reflectedLight.directDiffuse, 0.75)
      //outgoingLight = max(diffuseColor.rgb, mix( diffuseColor.rgb, emissive, 0.5 ));
      outgoingLight = (diffuseColor.rgb * tweakColor) + (((animatedLight.directDiffuse * 0.5) + animatedLight.indirectDiffuse + animatedLight.directSpecular + animatedLight.indirectSpecular + totalEmissiveRadiance));
      #ifdef SELFILLUMCOLOR
        outgoingLight *= max(vec3(0.25), selfIllumColor);
      #endif
      //outgoingLight = max( diffuseColor.rgb, diffuseColor.rgb * emissive );// + (((animatedLight.directDiffuse * 0.5) + animatedLight.indirectDiffuse + animatedLight.directSpecular + animatedLight.indirectSpecular + totalEmissiveRadiance)* 0.5);
    #endif
    #ifdef USE_ENVMAP
      #if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )
        vec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );
        vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
        #ifdef ENVMAP_MODE_REFLECTION
          vec3 reflectVec = reflect( cameraToVertex, worldNormal );
        #else
          vec3 reflectVec = refract( cameraToVertex, worldNormal, refractionRatio );
        #endif
      #else
        vec3 reflectVec = vReflect;
      #endif
      #ifdef ENVMAP_TYPE_CUBE
        vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
      #elif defined( ENVMAP_TYPE_EQUIREC )
        vec2 sampleUV;
        reflectVec = normalize( reflectVec );
        sampleUV.y = asin( clamp( reflectVec.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
        sampleUV.x = atan( reflectVec.z, reflectVec.x ) * RECIPROCAL_PI2 + 0.5;
        vec4 envColor = texture2D( envMap, sampleUV );
      #elif defined( ENVMAP_TYPE_SPHERE )
        reflectVec = normalize( reflectVec );
        vec3 reflectView = normalize( ( viewMatrix * vec4( reflectVec, 0.0 ) ).xyz + vec3( 0.0, 0.0, 1.0 ) );
        vec4 envColor = texture2D( envMap, reflectView.xy * 0.5 + 0.5 );
      #else
        vec4 envColor = vec4( 0.0 );
      #endif
      envColor = envMapTexelToLinear( envColor );
      #ifdef ENVMAP_BLENDING_MULTIPLY
        outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, (specularStrength * reflectivity) * (1.0 - diffuseColor.a) );
      #elif defined( ENVMAP_BLENDING_MIX )
        outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity * (1.0 - diffuseColor.a) );
      #elif defined( ENVMAP_BLENDING_ADD )
        outgoingLight += (envColor.xyz * specularStrength * reflectivity) * (1.0 - diffuseColor.a);
      #endif
    #endif
    gl_FragColor = vec4( outgoingLight, diffuseColor.a );
    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
    #if defined( WATER )
      gl_FragColor.rgb *= waterAlpha;
      gl_FragColor.a = waterAlpha;
    #endif
    #ifdef HOLOGRAM
      
      vec2 q = vUv;
      vec2 uv = vUv;
      vec3 oricol = outgoingLight.xyz;
      vec3 col = texture2D(map, vUv).rgb;
      float gray = dot(col, vec3(0.299, 0.587, 0.114));

      col.r = gray * 0.33;
      col.g = gray * 0.75;
      col.b = clamp(gray * 1.5, 0.0, 1.0);

      col = clamp(col*0.5+0.5*col*col*1.2,0.0,1.0);
      col *= 0.6 + 0.4*16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y);
      col *= vec3(0.9,1.0,0.7);
      col *= 0.8+0.2*sin(10.0*time+uv.y*900.0);
      col *= 1.0-0.07*rand(vec2(time, tan(time)));
      gl_FragColor = vec4(col,0.5);
      
    #endif
    #include <dithering_fragment>
  }
  `,
  vertexShader: `
  #define PHONG
  varying vec3 vViewPosition;
  #ifndef FLAT_SHADED
    varying vec3 vNormal;
  #endif
  #include <common>
  #ifdef AURORA
    uniform float time;
  #endif

  #ifdef WATER
    uniform mat3 waterTransform;
    varying vec2 vUvWater;
  #endif

  #ifdef DANGLY
    attribute vec4 constraint;
    uniform float danglyDisplacement;
    uniform float danglyTightness;
    uniform float danglyPeriod;
  #endif
  #include <uv_pars_vertex>
  #include <uv2_pars_vertex>
  #include <displacementmap_pars_vertex>
  #include <envmap_pars_vertex>
  #include <color_pars_vertex>
  #include <fog_pars_vertex>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>
  #include <shadowmap_pars_vertex>
  #include <logdepthbuf_pars_vertex>
  #include <clipping_planes_pars_vertex>
  
  void main() {
    #ifdef WATER
      #if defined( USE_UV ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )
        vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
      #endif
      vUvWater = ( waterTransform * vec3( uv, 1 ) ).xy;
    #else
      #include <uv_vertex>
    #endif
    #include <uv2_vertex>
    #include <color_vertex>
    #include <beginnormal_vertex>
    #include <morphnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
  #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
    vNormal = normalize( transformedNormal );
  #endif
    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #ifdef USE_DISPLACEMENTMAP
      transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vUvWater ).x * displacementScale + displacementBias );
    #endif
    #ifdef DANGLY
      float wind = (1.0 * danglyPeriod) * ( cos(time) );
      transformed += vec3(cos(wind) * constraint.x, sin(wind) * constraint.y, cos(wind) * constraint.z * danglyTightness) * (constraint.w / 255.0) * (danglyDisplacement * 0.1);
    #endif
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    vViewPosition = - mvPosition.xyz;
    #include <worldpos_vertex>
    #include <envmap_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>
  }
  `,
  uniforms: THREE.UniformsUtils.merge([
    THREE.ShaderLib.phong.uniforms,
    { diffuse: { value: new THREE.Color() } },
    { selfIllumColor: { value: new THREE.Color() } },
    { tweakColor: { value: new THREE.Color() } },
    { time: { value: 0.0 } },
    { animatedUV: { value: new THREE.Vector4() } },
    { waterAlpha: { value: 1 } },
    { waterTransform: { value: new THREE.Matrix3() } },
    { danglyDisplacement: { value: 0 } },
    { danglyTightness: { value: 0 } },
    { danglyPeriod: { value: 0 } }
  ])
};