'use strict'
let workerGetter = require('./fluid-worker.js')


class FluidSolver2D{
  constructor(){
    let worker = new Worker(workerGetter.get());
    worker.addEventListener('message', (e)=>{
      this.messageProcessor(e.data);
    })
    this.worker = worker;
  }

  setOnNewImage(fn){
    this.onNewImage = fn;
  }

  messageProcessor(message){
    if(message.type === 'image') this.onNewImage(message);
  }

  start(){
    this.worker.postMessage({type:'start'})
  }
  stop(){
    this.worker.postMessage({type:'stop'})
  }
  setSize(s){
    this.worker.postMessage({
      type:'reset',
      width: s.width, height:s.height
    });
  }
  setJet(j){

    this.worker.postMessage({
      type:'jet',
      jet:j
    })
  }
}

module.exports = {
  initSimulation2d(options){
    return new FluidSolver2D();
  },

  initSimulation3d(options){
    return {};
  }
}
