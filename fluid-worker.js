"use strict"
function worker(){
  'use strict'
  const worker = this;
  const HORIZONTAL = 1;
  const VERTICAL = 2;

  let densityField = new Float32Array(1);
  let densityFieldPrev = new Float32Array(1);
  let U = new Float32Array(1);
  let UPrev = new Float32Array(1);
  let V= new Float32Array(1);
  let VPrev= new Float32Array(1);
  let simulationWidth = 1;
  let simulationHeight = 1;
  let isRunning = false;
  let currentJet = {x:{x:0,y:0}, v:{x:0, y:0}};
  let Viscosity = 1e-2;
  let oldSimulationTime = Date.now();
  let maxDensity = 0;
  let minDensity = Infinity;
  let defaultPressure = 100;

  const calculationFPS = 60,
        imageResultTicks = 1000/calculationFPS/2,
        maxFramesSkip = 2;

  let nextImageTick = Date.now();

  worker.addEventListener('message', e=>{
   eventProcessor(e.data); 
  })
  let intervalId = 0


  function eventProcessor(e){
    if(e.type == 'start'){
      isRunning = true;
      intervalId = setInterval(animate, 1000/calculationFPS);
      oldSimulationTime = Date.now();
      addPressure();
      return ;
    }

    if(e.type =='stop'){
      isRunning = false;
      clearInterval(intervalId);
      return ;
    }

    if(e.type == 'reset'){
      let width = parseInt(e.width);
      let height = parseInt(e.height);
      let w = width + 2;
      let h = height + 2;
      densityField = new Float32Array(w * h);
      densityFieldPrev = new Float32Array(w* h);
      U = new Float32Array(w* h);
      V = new Float32Array(w* h);
      UPrev = new Float32Array(w* h);
      VPrev = new Float32Array(w* h);
      simulationWidth = width;
      simulationHeight = height;

      return ;
    }

    if(e.type=='jet'){
      currentJet = e.jet;
      return; 
    }

  }

  function addPressure(){
   for(let i = 0; i <= simulationWidth; ++i){
      for(let j =0; j <= simulationHeight; ++j){
        densityField[ix(i,j)] = defaultPressure;
      }
    }
  }

  let draws = 0;
  function animate(){
    updateSimulation();
    if(draws > maxFramesSkip){
      sendImage();
      draws = 0;
    }
    ++draws;
  }

  function updateSimulation(){
    let now = Date.now();
    let dt = (now - oldSimulationTime) / 1000;
    maxDensity = 0;
    minDensity = Infinity;
    //randomDensity();
    clearFields();
    addJet();
    velocityStep(U, V, UPrev, VPrev, Viscosity, 0.020);
    densityStep(densityField, densityFieldPrev, U, V, Viscosity, 0.020);
    oldSimulationTime = now;
  }

  function sendImage(){
    let image = prepareImage();
    let message = {
      type:'image',
      image:image.buffer,
      width:simulationWidth, 
      height:simulationHeight
    }
    worker.postMessage(message, [message.image]);
  }

  function clearFields(){
    for(let i =0; i< ((simulationWidth+2) * (simulationHeight+2)); ++i){
      densityFieldPrev[i] =0;
      UPrev[i] = 0;
      VPrev[i] = 0;
    }
  }

  function prepareImage(){
    let image= new Uint8ClampedArray((simulationWidth)*(simulationHeight) * 4);
    console.log("md =", maxDensity, minDensity);
    for(let i = 1; i < simulationWidth; ++i)
      for (let j =1; j< simulationHeight; ++j){
        let fix = ix(i,j);
        let x = densityField[fix] - minDensity;
        let M = maxDensity - minDensity;
       
        let IX = fix*4;
        let g = x>0? x:0;
        let r = x<0? -x:0;
        image[IX] = r/maxDensity*255; // red
        image[IX+1] = g/M*255;
        image[IX+2] = 0;
        image[IX+3] = 255;
      }
    return image;
  }


  function addJet(){
    let p = currentJet.x;
    let v = currentJet.v;
    let ix_ = ix(p.x , p.y);
    UPrev[ix_] = v.x;
    VPrev[ix_] = v.y;
    densityFieldPrev[ix_] = Math.hypot(v.x, v.y);
  };

  function densityConsumer(){
    densityFieldPrev[ix(50,50)] = -30;
  }

  function randomDensity(){
    let w = Math.floor(Math.random()*simulationWidth);
    let h = Math.floor(Math.random()*simulationHeight);
    let p = Math.random();

    if(p > 0.9) densityFieldPrev[ix(w,h)] = 50;
    if(p > 0.9) UPrev[ix(w,h)] = 400;
    if(p > 0.9) VPrev[ix(w,h)] = 400;
  }

  function ix(w,h){
    return h * simulationWidth + w;
  }
  function lin_solve(b, x, x0, a, c, iterations) {
    if(!iterations) iterations = 20;
    let height = simulationHeight;
    let width = simulationWidth;
    let rowSize = width;
    let invC = 1 / c;
    let to = x, from = x0;
    for (var k=0 ; k<iterations; k++) {
      for (var j=1 ; j<=height; j++) {
        for (var i=1; i<=width; i++){
          to[ix(i,j)] = (from[ix(i,j)] + a*(to[ix(i-1,j)]+to[ix(i+1,j)]+
                                          to[ix(i,j-1)]+to[ix(i,j+1)]))*invC; 
        }
      }
      defineBoundaries(x,b);
    }
  }
  function diffuse(to, from, condition, viscosity, dt){
    //let a = viscosity;
    let a = dt*viscosity;// * simulationWidth * simulationHeight;
    lin_solve(condition, to, from, a, 1+ 4*a);
  }

  function diffuse_old(to, from, condition ,viscosity, dt){
    let a = dt*viscosity; //  * simulationWidth * simulationHeight;
    for(let k =0;k<20;++k){
      for(let i=1; i<=simulationWidth; ++i)
        for(let j=1; j <=simulationHeight; ++j)
          to[ix(i,j)] = (from[ix(i,j)] + a*(to[ix(i-1,j)]+to[ix(i+1,j)]+
                                          to[ix(i,j-1)]+to[ix(i,j+1)]))/(1+4*a); 
          
      defineBoundaries(to, condition) 
    }

  }
  function clamp(x, m, M){
    return Math.min(Math.max(x,m),M);
  }
  function advect(d, dprev, u,v, condition, dt){
    let dtw = dt * simulationWidth;
    let dth = dt * simulationHeight;
    for(let i=1; i<=simulationWidth; ++i){
      for(let j=1; j <=simulationHeight; ++j){
        let x = clamp(i - dtw * u[ix(i,j)], 0.5, simulationWidth+0.5);
        let y = clamp(j - dth * v[ix(i,j)], 0.5, simulationHeight+0.5);
        let i0 = Math.floor(x), i1 = i0+1;
        let j0 = Math.floor(y), j1 = j0+1;
        let s1 = x-i0, s0 = 1-s1, t1 = y-j0, t0 = 1-t1;
        let newDensity = s0*(t0*dprev[ix(i0,j0)]+t1*dprev[ix(i0,j1)])+
                     s1*(t0*dprev[ix(i1,j0)]+t1*dprev[ix(i1,j1)]);
        d[ix(i,j)] = newDensity;
        if(condition == 0){
          maxDensity = Math.max(maxDensity, d[ix(i,j)]);
          minDensity = Math.min(minDensity, d[ix(i,j)]);
        }
      }
    }
    defineBoundaries(d, condition);
  };

  function addFields(to, from, dt){
    from.forEach((x,ix)=>to[ix] += x*dt);
  }

  function densityStep(d,dprev, u, v, viscosity, dt){
    addFields(d,dprev,dt);
    diffuse(dprev, d, 0, viscosity, dt);
    advect(d, dprev, u, v, 0, dt);
  };

  function velocityStep(u, v, u0, v0, viscosity, dt){ 
    addFields(u, u0, dt); addFields(v, v0, dt);
    diffuse(u0, u, 1, viscosity, dt);
    diffuse(v0, v, 2, viscosity, dt);
    project(u0, v0, u, v);
    advect(u,u0,u0,v0, 1, dt);
    advect(v,v0,u0,v0, 2, dt);
    project(u, v, u0, v0);
  };

  function project(u, v, p, div){
    let hw = 1/simulationWidth;
    let hh = 1/simulationHeight;
    let h = -0.5 / Math.sqrt(simulationWidth*simulationHeight);
    
    for(let i = 1; i <= simulationWidth; ++i){
      for(let j = 1; j <= simulationHeight; ++j){
        div[ix(i,j)] = h*(u[ix(i+1,j)] - u[ix(i-1,j)]+ v[ix(i,j+1)] - v[ix(i,j-1)]);
        // div[ix(i,j)] = -0.5*(hw*(u[ix(i+1,j)] - u[ix(i-1,j)])+
                             // hh*(v[ix(i,j+1)] - v[ix(i,j-1)])); 
        p[ix(i,j)] = 0;
      }
    }

    defineBoundaries(div, 0); defineBoundaries (p, 0);

    for (let k=0 ; k<20 ; k++ ) {
      for (let i=1 ; i<=simulationWidth ; ++i ) {
        for (let j=1 ; j<= simulationHeight ; ++j ) {
          p[ix(i,j)] = (div[ix(i,j)] + p[ix(i-1,j)] + p[ix(i+1,j)]+
                                       p[ix(i,j-1)] + p[ix(i,j+1)])/4;
        }
      }
      defineBoundaries (p,0);
    }

    for (let i=1 ; i<=simulationWidth ; i++ ) {
      for (let j=1 ; j<=simulationHeight ; j++ ) {
        u[ix(i,j)] -= 0.5*(p[ix(i+1,j)]-p[ix(i-1,j)])/hw;
        v[ix(i,j)] -= 0.5*(p[ix(i,j+1)]-p[ix(i,j-1)])/hh;
      }
    }
    defineBoundaries(u,1); defineBoundaries(v,2);
  }

  function zeroRightSide(x, b){
    let v = 0 ;
    if(b === 1){
      for(let i =0 ; i<= simulationHeight; ++i){
        x[ix(simulationWidth +1, i)] =  v;
      }
    }else{
      for(let i =0 ; i<= simulationHeight; ++i){
        x[ix(simulationWidth +1, i)] =  2*x[ix(simulationWidth , i)];
      }
    }
    
  }

  function defineBoundaries(x, b){
    // zeroRightSide(x, b);
    let W = simulationWidth;
    let H = simulationHeight
      for ( let i=1 ; i<= H; ++i ) {
        x[ix(0,i)]   = b === 1 ? -x[ix(1, i)] : x[ix(1,i)];
        x[ix(W+1,i)] = b === 1 ? -x[ix(W, i)] : x[ix(W, i)];
      }
      for(let i=0; i<=W; ++i){
        x[ix(i,0)]   = b===2 ? -x[ix(i,1)] : x[ix(i,1)];
        x[ix(i,H+1)] = b===2 ? -x[ix(i,H)] : x[ix(i,H)];
      }
      x[ix(0,0)]     = 0.5*(x[ix(1, 0)]   +x[ix(0, 1)]);
      x[ix(0, H+1)]  = 0.5*(x[ix(1, H+1)] +x[ix(0, H)]);
      x[ix(W+1,0 )]  = 0.5*(x[ix(W, 0)]   +x[ix(W+1, 1)]);
      x[ix(W+1,H+1)] = 0.5*(x[ix(W, H+1)] +x[ix(W+1, H)]);
    }

}

module.exports.get = function() {
  let URL = window.URL;
  let stringified = '(' + worker + ').call(self)';
  let blob = new Blob([stringified], {type: 'application/javascript'});
  return URL.createObjectURL(blob);
}
