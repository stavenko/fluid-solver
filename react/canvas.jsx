'use strict'
let React = require('react');
let ReactDOM = require('react-dom');

class Canvas extends React.Component {
  constructor(props){
    super(props);
  }

  setSize(s){
    if(this.node){
      this.node.width = s.width;
      this.node.height = s.height;

    }
  }

  componentDidMount(){
    this.node = ReactDOM.findDOMNode(this);
    this.ctx = this.node.getContext('2d');
  }

  setNewImage(imageData){
    if(this.ctx)
      this.ctx.putImageData(imageData, 0, 0);
    
  }

  render(){
    return <canvas />
  }
}

module.exports = Canvas
