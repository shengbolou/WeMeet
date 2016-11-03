import React from 'react';
import PostComment from './postComment';
import PostCommentEntry from './postCommentEntry';
import PostCommentThread from './postCommentThread';
import {unixTimeToString} from '../util'

export default class PostFeedItem extends React.Component{

  constructor(props){
    super(props);
    this.state = props.data;
  }



  render(){
    var data = this.state;
    var contents;
    switch(data.type){
      case "general":
        contents = data.contents;
        break;
      default:
        throw new Error("Unknown FeedItem: " + data.type);
    }

    return(
      <div className="panel panel-default">
        <div className="panel-heading">
          <div className="media">
            <div className="media-left">
              <a href="#">
                <img className="media-object" src={contents.author.avatar} width="50px" height="50px" alt="..."></img>
              </a>
            </div>
            <div className="media-body">
              <h4 className="media-heading">{contents.author.firstname} {contents.author.lastname}</h4>
              {unixTimeToString(contents.postDate)}
            </div>
          </div>
        </div>
        <div className="panel-body">
          <p>
            {contents.text}
          </p>
          <img src={contents.img} width="100%" height="100%" alt="" />
        </div>
        <div className="panel-footer">
          <div className="row">
            <div className="col-md-12">
              <a href="#"><span className="glyphicon glyphicon-heart"></span>{data.likeCounter.length}</a>
              <a href="#"><span className="glyphicon glyphicon-comment"></span>{data.comments.length}</a>

              <PostCommentThread>
                {data.comments.map((comment,i)=>{
                  return (
                    <PostComment key={i} data={comment} />
                  )
                })}
              </PostCommentThread>

              <PostCommentEntry />
            </div>
          </div>
        </div>
      </div>
    );
  }
}