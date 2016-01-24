'use strict'
let React = require('react');
let o = require('object-path');

class SimulationController extends React.Component{
  constructor(props){
    super(props);
    this.solverInstance = this.props.solver;
    this.state={
      size:{
        width:256 ,
        height:128  
      },

      jet:{
        x:{x:4, y:64},
        v:{x:10, y:0}
      }
    }
  }

  componentDidMount(){
    this.updateSize();
    this.updateJet();
  }

  simulationStart(){
    console.log('simulation strt')
    this.solverInstance.start();
  }

  simulationStop(){
    this.solverInstance.stop();
  }

  updateSize(){
    this.props.parent.refs.canvas.setSize(this.state.size);
    this.solverInstance.setSize(this.state.size);
  }


  updateJet(){
    let pf = tryf(isNaN, parseFloat, 0);
    let pi = tryf(isNaN, parseInt, 0);
    let j = {
      x:{
        x: pi(this.state.jet.x.x), 
        y: pi(this.state.jet.x.y),
      },
      v:{
        x: pf(this.state.jet.v.x),
        y: pf(this.state.jet.v.y),
      }
    }
    this.solverInstance.setJet(j);

    function tryf(c, f, d){
      return (x)=>c(f(x))?d:f(x);
    }
  }

  getValueLink(path, fnList){
    let fns = fnList || [];
    return {
      value: o.get(this.state, path),
      requestChange: (value)=>{
        let ns = this.state;
        o.set(ns, path, value);
        this.setState(ns);
        fns.forEach(f=>f());
      }
    }
  }

  render(){
    return <div>
      <div className='row'>
        <div className='col-xs-12'>
          <a className='btn btn-primary' onClick={(e)=>this.simulationStart()}>
            <span className='glyphicon glyphicon-play'/>
            Start
          </a>
          <a className='btn' onClick={(e)=>this.simulationStop()}>
            <span className='glyphicon glyphicon-pause'/>
            Stop
          </a>
      </div>
      <div className='form-group'>
        <label className='col-xs-2 control-label'>Ширина </label>
        <div className='col-xs-10'>
          <input 
            valueLink={this.getValueLink('size.width',[()=>{this.updateSize();}])} />
        </div>
      </div>
      <div className='form-group'>
        <label className='col-xs-2 control-label'>Высота </label>
        <div className='col-xs-10'>
          <input 
            valueLink={this.getValueLink('size.height',[()=>{this.updateSize();}])} />
        </div>
      </div>

      <div className='row'>
        <div className='cols-xs-12' >
          <h4>струйка</h4>
        </div>
      </div>

      <div className='form-group'>
        <label className='col-xs-2 control-label'> Из </label>
        <div className='col-xs-5'>
          <input 
            valueLink={this.getValueLink('jet.x.x',[()=>{this.updateJet();}])} />
        </div>
        <div className='col-xs-5'>
          <input 
            valueLink={this.getValueLink('jet.x.y',[()=>{this.updateJet();}])} />
        </div>
      </div>
      <div className='form-group'>
        <label className='col-xs-2 control-label'> Скорость </label>
        <div className='col-xs-5'>
          <input 
            valueLink={this.getValueLink('jet.v.x',[()=>{this.updateJet();}])} />
        </div>
        <div className='col-xs-5'>
          <input 
            valueLink={this.getValueLink('jet.v.y',[()=>{this.updateJet();}])} />
        </div>
      </div>

    </div>
  </div>
  }
}

module.exports = SimulationController;

