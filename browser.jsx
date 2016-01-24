'use strict'

require('bootstrap-webpack');
let fluidSolver = require('./index.js');
let Canvas = require('./react/canvas.jsx')
let SimulationController = require('./react/simulationController.jsx')

let React = require('react');
let ReactDom = require('react-dom');

class View extends React.Component {
  constructor(props){ 
    super(props)
    this.solverInstance = fluidSolver.initSimulation2d();
    this.solverInstance.setOnNewImage(i=>this.onNewImageCreated(i))
  }

  onNewImageCreated(image){
    let array = new Uint8ClampedArray(image.image)
    let img = new ImageData(array, image.width, image.height)
    this.refs.canvas.setNewImage(img);
  }

  render(){
    return <div>
    <h1>Fluid solver  </h1>

    <div className='container-fluid'>
      <div className = 'row'>
        <div className='col-xs-6'>
          <Canvas ref='canvas' />
        </div>
        <div className='col-xs-6'>
          <SimulationController 
            ref='controller' 
            solver={this.solverInstance} 
            parent={this}
          />
        </div>
      </div>
    </div>
    </div>
  }
}


document.addEventListener('DOMContentLoaded', ()=>{
  console.log(document.getElementById('content') );
  ReactDom.render(<View />, document.getElementById('content') );
});

