import React from 'react';
import {Link} from 'react-router-dom';
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardMedia from "@material-ui/core/CardMedia";
import CardContent from "@material-ui/core/CardContent";
import Avatar from "@material-ui/core/Avatar";
import Chip from '@material-ui/core/Chip';
import Icon from '@material-ui/core/Icon';

var moment = require('moment');
// var debug = require('react-debug');

export default class ActivityFeedItem extends React.Component{

    constructor(props){
        super(props);
        this.state = props.data;
    }

    render(){
        var startTime = moment(this.state.startTime).calendar();
        var endTime = moment(this.state.endTime).calendar();
        return(
            <Card style={{marginBottom:'30px',boxShadow:'0 10px 28px 0 rgba(137, 157, 197, .12)'}}>
                <CardHeader
                style={{fontFamily:'inherit'}}
                title={this.state.author.fullname}
                subheader={this.state.author.description}
                avatar={<Link to={"/profile/"+this.state.author._id}>
                            <Avatar src={this.state.author.avatar}/>
                        </Link>}
                />
                <Link to={"/activityDetail/"+this.state._id}> 
                    <CardMedia image={this.state.img}
                        style={{height: '400px'}}
                    />
                </Link>
                <CardContent>
                    <div className="row" style={{marginBottom: '20px'}}>
                        <div className="col-md-10">
                            <h3>{this.state.title}</h3>
                            <h4>{startTime+"--"+endTime}</h4>
                            <Chip
                                avatar={
                                <Avatar>
                                    <Icon style={{fontSize:'20px'}}className='fas fa-location-arrow'></Icon>
                                </Avatar>
                                }
                                label={this.state.location}
                            />
                        </div>
                        <div className="col-md-2">
                            <div className='pull-right'>
                                <Chip style={{marginTop:'30px',marginRight:'10px',
                                backgroundColor:"#607D8B",color:'white'}} 
                                label={this.state.type}/>
                            </div>
                        </div>
                    </div>
                    <div style={{marginBottom: '10px'}}>
                        {this.state.description}
                    </div>
                </CardContent>
            </Card>
        );
    }
}
