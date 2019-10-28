import React, { Component } from 'react';

export class HomePage extends Component {
  constructor(props: any) {
    super(props);
  }

  render(){
    return (
      <div className="Window">
        <h3>Home Page</h3>
        <p>This page is the home</p>
      </div>
    )
  }
}