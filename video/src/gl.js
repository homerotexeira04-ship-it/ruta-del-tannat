/* ============================================================
   gl.js — pipeline de postproducción en WebGL2
   fondos por shader  →  composición/transición por sub-cuadro
   →  acumulación en float (motion blur real)  →  bloom (dual
   Kawase)  →  aberración cromática, viñeta, grano, dither.
   ============================================================ */
(function () {
  const { W, H } = R;
  const canvas = document.getElementById('out');
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!gl) throw new Error('WebGL2 no disponible');
  gl.getExtension('EXT_color_buffer_float'); gl.getExtension('EXT_color_buffer_half_float'); gl.getExtension('OES_texture_float_linear');

  const VS = `#version 300 es
in vec2 p; out vec2 vUV; void main(){ vUV=p*.5+.5; gl_Position=vec4(p,0.,1.); }`;

  const HASH = `
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
const mat2 M2=mat2(1.6,1.2,-1.2,1.6);
float fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<4;i++){ s+=a*vn(p); p=M2*p; a*=.5;} return s; }
float fbm2(vec2 p){ float s=0.,a=.5; for(int i=0;i<3;i++){ s+=a*vn(p); p=M2*p; a*=.5;} return s; }
`;

  /* ---------- fondos ---------- */
  const FS_BG = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform vec2 uRes; uniform float uT; uniform int iMode;
uniform vec3 uC0,uC1,uC2,uC3;
uniform vec4 uP; // escala, warp, velocidad, fuerza normal
uniform vec4 uQ; // luz x, luz y, brillo, ganancia especular
uniform vec4 uR; // extra: densidad contornos, offx, offy, glow
${HASH}
float height(vec2 p,float t){
  vec2 q=vec2(fbm(p+vec2(0.,t*.12)),fbm(p+vec2(5.2,1.3)-t*.09));
  vec2 r=vec2(fbm(p+uP.y*q+vec2(1.7,9.2)+t*.07),fbm(p+uP.y*q+vec2(8.3,2.8)-t*.05));
  return fbm(p+uP.y*r);
}
void main(){
  vec2 uv=vUV; float asp=uRes.x/uRes.y; vec2 c=uv-.5; vec3 col;
  if(iMode==0){ // líquido / seda de vino
    vec2 p=c*vec2(asp,1.)*uP.x+uR.yz; float t=uT*uP.z;
    float e=0.012; float h=height(p,t), hx=height(p+vec2(e,0.),t), hy=height(p+vec2(0.,e),t);
    vec3 n=normalize(vec3(-(hx-h)/e*uP.w,-(hy-h)/e*uP.w,1.));
    vec3 L=normalize(vec3(uQ.xy,.55)); float diff=clamp(dot(n,L)*.5+.5,0.,1.);
    vec3 Hh=normalize(L+vec3(0.,0.,1.)); float sp=pow(max(dot(n,Hh),0.),uQ.z);
    float fr=pow(1.-n.z,2.);
    float hh=smoothstep(.25,.75,h);
    vec3 base=mix(uC0,uC1,hh); base=mix(base,uC2,smoothstep(.62,.95,h)*.35);
    col=base*(.45+.85*diff)+uC3*sp*uQ.w+uC2*fr*.35;
    col+=uC1*uR.w*exp(-dot(c*vec2(asp,1.),c*vec2(asp,1.))*2.2);
  } else if(iMode==1){ // papel
    vec2 pp=uv*uRes;
    float fib=vn(pp*vec2(.9,.12))*.5+vn(pp*vec2(.12,.9))*.5; float gr=vn(pp*.55);
    col=uC0*(1.+(fib-.5)*.035+(gr-.5)*.03);
    col=mix(col,uC1,smoothstep(.2,1.1,length(c*vec2(asp*.8,1.)))*.9);
    col+=uC2*exp(-dot(c-vec2(-.22,.18),c-vec2(-.22,.18))*3.)*.08;
  } else if(iMode==2){ // topografía
    vec2 p=c*vec2(asp,1.)*uP.x+uR.yz; float t=uT*uP.z;
    float h=fbm(p+vec2(t*.2,t*.1))*.9+fbm2(p*2.7-t*.1)*.12;
    float v=h*uR.x; float d=abs(fract(v-.5)-.5)/fwidth(v);
    float l=1.-clamp(d*.9,0.,1.);
    float major=1.-clamp(abs(fract(v/5.-.5)-.5)/fwidth(v/5.)*.9,0.,1.);
    col=mix(uC0,uC1,smoothstep(.2,.8,uv.y*.6+h*.5));
    col+=uC2*(l*.16+major*.30);
    col+=uC3*uR.w*exp(-dot(c,c)*3.2);
  } else if(iMode==3){ // agua termal con cáusticas
    vec2 p=mod(uv*vec2(asp,1.)*uP.x*6.2831853,6.2831853)-250.; float t=uT*uP.z+23.;
    vec2 i=p; float cc=1.;
    for(int n=0;n<5;n++){ float tt=t*(1.-(3.5/float(n+1))); i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x)); cc+=1./length(vec2(p.x/(sin(i.x+tt)/.005),p.y/(cos(i.y+tt)/.005))); }
    cc/=5.; cc=1.17-pow(cc,1.4); float k=pow(abs(cc),8.);
    col=mix(uC1,uC0,pow(uv.y,.8))+uC2*clamp(k,0.,1.)*.42+uC3*uR.w*exp(-dot(c-vec2(0.,-.1),c-vec2(0.,-.1))*2.4);
  } else { // degradé radial
    float d=length(c*vec2(asp,1.));
    col=mix(uC1,uC0,smoothstep(0.,.9,d));
    col+=uC2*exp(-dot(c-uR.yz,c-uR.yz)*4.)*uR.w;
    col*=1.+(vn(uv*uRes*.6)-.5)*.02;
  }
  o=vec4(col,1.);
}`;

  /* ---------- composición de escenas + transiciones ---------- */
  const FS_COMP = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D tBgA,tBgB,tFgA,tLgA,tFgB,tLgB;
uniform int iTrans; uniform float uP; uniform vec4 uPar; uniform vec2 uRes; uniform float uLG, uW;
vec3 sc(sampler2D bg,sampler2D fg,sampler2D lg,vec2 uv){
  vec4 f=texture(fg,uv); vec3 b=texture(bg,uv).rgb; vec3 l=texture(lg,uv).rgb;
  return b*(1.-f.a)+f.rgb+l*uLG;
}
const vec3 GOLD=vec3(.95,.78,.45), HI=vec3(1.,.93,.75);
void main(){
  vec2 uv=vUV; float asp=uRes.x/uRes.y; vec3 col;
  if(iTrans==0){ col=sc(tBgA,tFgA,tLgA,uv); }
  else if(iTrans==1){ // IRIS desde un punto (la gota)
    vec2 cc=uPar.xy; float r=uP*uPar.z; float d=length((uv-cc)*vec2(asp,1.));
    float m=1.-smoothstep(r-.003,r+.003,d);
    vec3 A=sc(tBgA,tFgA,tLgA,uv), B=sc(tBgB,tFgB,tLgB,uv);
    col=mix(A,B,m);
    col+=HI*exp(-pow((d-r)/.006,2.))*uPar.w*step(.001,uP)*(1.-step(.999,uP));
  } else if(iTrans==2){ // LÍQUIDO sube desde abajo
    float s=sin(uP*3.14159);
    float edge=mix(-.12,1.12,uP)+.05*sin(uv.x*8.+uP*14.)*s+.022*sin(uv.x*21.-uP*20.)*s;
    float dd=uv.y-edge; float m=1.-smoothstep(-.002,.002,dd);
    vec2 uvA=uv; uvA.y+=.02*exp(-abs(dd)*14.)*s*sign(dd);
    vec3 A=sc(tBgA,tFgA,tLgA,uvA), B=sc(tBgB,tFgB,tLgB,uv);
    A*=1.-.42*exp(-max(dd,0.)*16.)*(1.-m);
    col=mix(A,B,m);
    col+=HI*exp(-pow(dd/.0045,2.))*.9*s+GOLD*exp(-pow(dd/.02,2.))*.25*s;
  } else if(iTrans==3){ // PERSIANAS verticales
    float N=uPar.x; float idx=floor(uv.x*N); float st=uPar.y;
    float pi_=clamp((uP*(1.+st)-idx/N*st),0.,1.); pi_=pi_*pi_*(3.-2.*pi_);
    float up=mod(idx,2.); float yy=mix(uv.y,1.-uv.y,up);
    float m=1.-smoothstep(pi_-.002,pi_+.002,yy)*1.; m=step(yy,pi_*1.0005);
    vec3 A=sc(tBgA,tFgA,tLgA,uv), B=sc(tBgB,tFgB,tLgB,uv);
    col=mix(A,B,m);
    float edge=exp(-pow((yy-pi_)/.006,2.))*step(.001,pi_)*step(pi_,.999);
    col+=HI*edge*.8;
    float gx=abs(fract(uv.x*N)-.5); col*=1.-.55*smoothstep(.485,.5,gx)*step(.001,pi_)*step(pi_,.999);
  } else if(iTrans==4){ // WHIP (paneo con smear)
    vec2 d=uPar.xy; float sm=uPar.w;
    vec3 acc=vec3(0.);
    for(int k=0;k<8;k++){
      float kk=(float(k)/7.-.5)*sm;
      float pp=uP+kk;
      float u=dot(uv,d)+pp*dot(d,d);
      vec3 s;
      if(u<1.){ s=sc(tBgA,tFgA,tLgA,clamp(uv+d*pp,0.,1.)); }
      else { s=sc(tBgB,tFgB,tLgB,clamp(uv+d*(pp-1.),0.,1.)); }
      acc+=s;
    }
    col=acc/8.;
  } else if(iTrans==5){ // FLASH en el beat
    float m=step(.5,uP);
    vec2 cc=uv-.5; float r=length(cc*vec2(asp,1.));
    vec3 A=sc(tBgA,tFgA,tLgA,uv), B=sc(tBgB,tFgB,tLgB,uv);
    col=mix(A,B,m);
    float f=exp(-pow((uP-.5)/.12,2.));
    col+=HI*f*uPar.x*(1.-smoothstep(0.,1.2,r)*.5);
    col+=GOLD*exp(-pow((r-uP*1.3)/.04,2.))*uPar.y*step(.5,uP);
  } else if(iTrans==6){ // ZOOM a través
    vec2 cc=uPar.xy; float z=uPar.z;
    float mA=smoothstep(.30,.62,uP);
    vec3 acc=vec3(0.);
    for(int k=0;k<10;k++){
      float f=float(k)/9.;
      float sA=1./(1.+uP*z*(1.+f*uPar.w*uP));
      vec3 A=sc(tBgA,tFgA,tLgA,cc+(uv-cc)*sA);
      float sB=1.+(1.-uP)*.9*(1.+f*uPar.w*(1.-uP));
      vec3 B=sc(tBgB,tFgB,tLgB,clamp(cc+(uv-cc)/sB,0.,1.));
      acc+=mix(A,B,mA);
    }
    col=acc/10.;
    col+=HI*exp(-pow((uP-.5)/.1,2.))*.25;
  } else { // BARRIDO diagonal con filo dorado
    vec2 dir=normalize(uPar.xy); float ext=abs(dir.x)*asp+abs(dir.y);
    float pr=dot((uv-.5)*vec2(asp,1.),dir)/ext+.5;
    float edge=mix(-.08,1.08,uP);
    float dd=pr-edge; float m=1.-smoothstep(-.002,.002,dd);
    vec3 A=sc(tBgA,tFgA,tLgA,uv+dir*vec2(1./asp,1.)*.03*uP*step(0.,dd));
    vec3 B=sc(tBgB,tFgB,tLgB,uv-dir*vec2(1./asp,1.)*.05*(1.-uP)*step(dd,0.));
    col=mix(A,B,m);
    col+=HI*exp(-pow(dd/.004,2.))*.95+GOLD*exp(-pow(dd/.03,2.))*.28;
  }
  o=vec4(col*uW,1.);
}`;

  /* ---------- bloom (dual Kawase) ---------- */
  const FS_BRIGHT = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform sampler2D tSrc; uniform vec2 uPx; uniform float uThr;
vec3 thr(vec3 c){ float b=max(max(c.r,c.g),c.b); float k=max(b-uThr,0.); return c*(k/max(b,1e-4)); }
void main(){ vec3 s=thr(texture(tSrc,vUV).rgb)*4.;
  s+=thr(texture(tSrc,vUV+vec2(-1,-1)*uPx).rgb)+thr(texture(tSrc,vUV+vec2(1,-1)*uPx).rgb)+thr(texture(tSrc,vUV+vec2(-1,1)*uPx).rgb)+thr(texture(tSrc,vUV+vec2(1,1)*uPx).rgb);
  o=vec4(s/8.,1.); }`;
  const FS_DOWN = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform sampler2D tSrc; uniform vec2 uPx;
void main(){ vec3 s=texture(tSrc,vUV).rgb*4.;
  s+=texture(tSrc,vUV+vec2(-1,-1)*uPx).rgb+texture(tSrc,vUV+vec2(1,-1)*uPx).rgb+texture(tSrc,vUV+vec2(-1,1)*uPx).rgb+texture(tSrc,vUV+vec2(1,1)*uPx).rgb;
  o=vec4(s/8.,1.); }`;
  const FS_UP = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform sampler2D tSrc; uniform vec2 uPx; uniform float uK;
void main(){ vec3 s=texture(tSrc,vUV+vec2(-2,0)*uPx).rgb+texture(tSrc,vUV+vec2(0,2)*uPx).rgb+texture(tSrc,vUV+vec2(2,0)*uPx).rgb+texture(tSrc,vUV+vec2(0,-2)*uPx).rgb;
  s+=2.*(texture(tSrc,vUV+vec2(-1,1)*uPx).rgb+texture(tSrc,vUV+vec2(1,1)*uPx).rgb+texture(tSrc,vUV+vec2(1,-1)*uPx).rgb+texture(tSrc,vUV+vec2(-1,-1)*uPx).rgb);
  o=vec4(s/12.*uK,1.); }`;

  /* ---------- final ---------- */
  const FS_FINAL = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o;
uniform sampler2D tAcc,tBloom; uniform vec2 uRes; uniform float uBloom,uCA,uVig,uGrain,uFrame,uFade,uSat,uWarm;
uniform vec3 uFlash;
${HASH}
void main(){
  vec2 uv=vUV; vec2 c=uv-.5; float asp=uRes.x/uRes.y; float d=length(c*vec2(asp,1.));
  vec2 ca=c*uCA*(.25+d);
  vec3 col; col.r=texture(tAcc,uv+ca).r; col.g=texture(tAcc,uv).g; col.b=texture(tAcc,uv-ca).b;
  vec3 bl=texture(tBloom,uv).rgb; col+=bl*uBloom;
  col+=uFlash;
  float l=dot(col,vec3(.299,.587,.114)); col=mix(vec3(l),col,uSat);
  col=mix(col,col*vec3(1.04,1.0,.94),uWarm);
  vec3 cs=clamp(col,0.,1.); col=mix(col,cs*cs*(3.-2.*cs),.22); // S suave (sin invertir el HDR)
  col*=1.-uVig*smoothstep(.38,1.05,d);
  vec2 g=uv*uRes+vec2(fract(uFrame*.618)*91.,fract(uFrame*.381)*57.);
  float gn=hash(g)+hash(g*1.37+7.1)-1.;
  col+=gn*uGrain*(.45+.55*(1.-clamp(l,0.,1.)));
  col+=(hash(uv*uRes*1.13+uFrame)+hash(uv*uRes*.77+uFrame*1.7)-1.)/255.;
  col*=uFade;
  o=vec4(col,1.);
}`;

  /* ---------- infraestructura ---------- */
  const tri = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tri);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function prog(fs) {
    const p = gl.createProgram();
    for (const [t, s] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]) {
      const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) + '\n' + s.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n'));
      gl.attachShader(p, sh);
    }
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return { p, u: {} };
  }
  function setU(pr, name, v) {
    let loc = pr.u[name]; if (loc === undefined) loc = pr.u[name] = gl.getUniformLocation(pr.p, name);
    if (loc === null) return;
    if (typeof v === 'number') { if (name[0] === 'i' || name[0] === 't') gl.uniform1i(loc, v); else gl.uniform1f(loc, v); }
    else if (v.length === 2) gl.uniform2fv(loc, v); else if (v.length === 3) gl.uniform3fv(loc, v); else gl.uniform4fv(loc, v);
  }
  function tex(w, h, f16 = true) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    if (f16) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { t, w, h };
  }
  function fbo(T) {
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, T.t, 0);
    T.f = f; return T;
  }
  const rt = (w, h) => fbo(tex(w, h, true));
  function bind(unit, T) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, T.t); }
  function target(T) { gl.bindFramebuffer(gl.FRAMEBUFFER, T ? T.f : null); gl.viewport(0, 0, T ? T.w : W, T ? T.h : H); }
  const draw = () => gl.drawArrays(gl.TRIANGLES, 0, 3);

  const P = { bg: prog(FS_BG), comp: prog(FS_COMP), bright: prog(FS_BRIGHT), down: prog(FS_DOWN), up: prog(FS_UP), fin: prog(FS_FINAL) };

  const BGW = 960, BGH = 540;
  const bgPool = [rt(BGW, BGH), rt(BGW, BGH), rt(BGW, BGH), rt(BGW, BGH)];
  const acc = rt(W, H);
  const layers = {}; // texturas de capas 2D (RGBA8)
  for (const k of ['fgA', 'fgB']) layers[k] = tex(W, H, false);
  for (const k of ['lgA', 'lgB']) layers[k] = tex(W / 2, H / 2, false);
  const levels = []; // bloom
  { let w = W / 2, h = H / 2; for (let i = 0; i < 6; i++) { levels.push(rt(Math.max(2, w | 0), Math.max(2, h | 0))); w /= 2; h /= 2; } }

  function upload(T, cv) {
    gl.bindTexture(gl.TEXTURE_2D, T.t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  }

  let poolUsed = 0, bgCache = new Map();
  function beginFrame() {
    poolUsed = 0; bgCache = new Map();
    gl.disable(gl.BLEND); target(acc); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  }
  /* renderiza (una vez por cuadro) el fondo de una escena; clave = id de escena */
  function bgTex(key, bg, T) {
    if (bgCache.has(key)) return bgCache.get(key);
    const tx = bgPool[poolUsed++ % bgPool.length];
    gl.disable(gl.BLEND); gl.useProgram(P.bg.p); target(tx);
    const b = bg;
    setU(P.bg, 'uRes', [BGW, BGH]); setU(P.bg, 'uT', T);
    setU(P.bg, 'iMode', b.mode || 0);
    setU(P.bg, 'uC0', b.c0); setU(P.bg, 'uC1', b.c1); setU(P.bg, 'uC2', b.c2 || b.c1); setU(P.bg, 'uC3', b.c3 || b.c2 || b.c1);
    setU(P.bg, 'uP', b.p || [1.8, 2.2, 1, .12]); setU(P.bg, 'uQ', b.q || [-.5, .6, 24, .5]); setU(P.bg, 'uR', b.r || [8, 0, 0, 0]);
    draw(); bgCache.set(key, tx); return tx;
  }
  /* un sub-cuadro: sube las capas, compone (con transición) y acumula con peso w */
  function accumulate(s, w) {
    upload(layers.fgA, s.A.fg); upload(layers.lgA, s.A.lg);
    if (s.B) { upload(layers.fgB, s.B.fg); upload(layers.lgB, s.B.lg); }
    gl.useProgram(P.comp.p); target(acc);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    bind(0, s.A.bg); bind(1, (s.B || s.A).bg); bind(2, layers.fgA); bind(3, layers.lgA); bind(4, s.B ? layers.fgB : layers.fgA); bind(5, s.B ? layers.lgB : layers.lgA);
    for (const [i, n] of ['tBgA', 'tBgB', 'tFgA', 'tLgA', 'tFgB', 'tLgB'].entries()) setU(P.comp, n, i);
    setU(P.comp, 'iTrans', s.trans ? s.trans.type : 0); setU(P.comp, 'uP', s.trans ? s.trans.p : 0);
    setU(P.comp, 'uPar', s.trans ? s.trans.par : [0, 0, 0, 0]); setU(P.comp, 'uRes', [W, H]);
    setU(P.comp, 'uLG', s.lightGain === undefined ? 1.5 : s.lightGain); setU(P.comp, 'uW', w);
    draw(); gl.disable(gl.BLEND);
  }
  function finish(fx, frame) {
    gl.disable(gl.BLEND);
    // bloom
    gl.useProgram(P.bright.p); target(levels[0]); bind(0, acc); setU(P.bright, 'tSrc', 0);
    setU(P.bright, 'uPx', [1 / W, 1 / H]); setU(P.bright, 'uThr', fx.bloomThr === undefined ? 0.62 : fx.bloomThr); draw();
    gl.useProgram(P.down.p); setU(P.down, 'tSrc', 0);
    for (let i = 1; i < levels.length; i++) { target(levels[i]); bind(0, levels[i - 1]); setU(P.down, 'uPx', [.5 / levels[i - 1].w, .5 / levels[i - 1].h]); draw(); }
    gl.useProgram(P.up.p); setU(P.up, 'tSrc', 0); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = levels.length - 1; i > 0; i--) { target(levels[i - 1]); bind(0, levels[i]); setU(P.up, 'uPx', [.5 / levels[i].w, .5 / levels[i].h]); setU(P.up, 'uK', 1.0); draw(); }
    gl.disable(gl.BLEND);
    // final
    gl.useProgram(P.fin.p); target(null);
    bind(0, acc); bind(1, levels[0]); setU(P.fin, 'tAcc', 0); setU(P.fin, 'tBloom', 1);
    setU(P.fin, 'uRes', [W, H]); setU(P.fin, 'uBloom', fx.bloom === undefined ? 0.55 : fx.bloom);
    setU(P.fin, 'uCA', fx.ca || 0.0012); setU(P.fin, 'uVig', fx.vig === undefined ? 0.45 : fx.vig);
    setU(P.fin, 'uGrain', fx.grain === undefined ? 0.032 : fx.grain); setU(P.fin, 'uFrame', frame);
    setU(P.fin, 'uFade', fx.fade === undefined ? 1 : fx.fade); setU(P.fin, 'uSat', fx.sat === undefined ? 1.04 : fx.sat);
    setU(P.fin, 'uWarm', fx.warm === undefined ? 0.5 : fx.warm); setU(P.fin, 'uFlash', fx.flash || [0, 0, 0]);
    draw();
  }

  R.GL = { gl, canvas, beginFrame, bgTex, accumulate, finish };
})();
