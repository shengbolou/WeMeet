import React from 'react';
import {getUserData} from '../server';

export default class ProfileMainFeed extends React.Component{

  constructor(props){
    super(props);
    this.state = {};
  }

  getData(){
    getUserData(this.props.user,(userData)=>{
        this.setState(userData);
    });
  }

  componentDidMount(){
    this.getData();
  }

  render(){
    var location = (this.state.location === undefined ||Object.keys(this.state.location ).length === 0 ?
                    "Earth" : this.state.location.description);
    return(
      <div className="panel panel-default main-panel">
        <div className="panel-body">
          <div className="row">
            <div className="col-md-4">
              <center>
                <img src={this.state.avatar} alt="" />
              </center>
            </div>
            <div className="col-md-8">
              <div className="media">
                <h3>{this.state.firstname} {this.state.lastname}</h3>
                {this.state.description}
                <div className="location">
                  <span className="glyphicon glyphicon-map-marker"></span>
                  {location}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}