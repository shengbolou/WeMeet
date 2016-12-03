import React from 'react';
import {searchquery} from '../server';
import ActivityFeedItem from '../activity/activityFeedItem';
import SearchFeedUserFeedItem from './searchFeedUserFeedItem';
import SearchFeedPostFeedItem from './searchFeedPostFeedItem';

export default class SearchEntry extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      value: "",
      searchDataResult:{}
    }
  }
  handleChange(e) {
    e.preventDefault();
    this.setState({ value: e.target.value });
  }

  handleKeyUp(e) {
    e.preventDefault();
    if (e.key === "Enter") {
      this.search();
    }
  }
  search() {
    var trimmedTerm = this.state.value.trim();
    if (trimmedTerm !== "") {
      searchquery(this.props.user,trimmedTerm,(searchData)=>
        this.setState({searchDataResult:searchData})
      )
    }
  }


  render(){
    return(
      <div>
        <div className="panel panel-default">
          <div className="panel-heading">
            <div className="media">
              <div className="media-body">
                <input type="text" className="form-control" placeholder="Welcome to We Meet, please search" onChange={(e) => this.handleChange(e)}
              onKeyUp={(e) => this.handleKeyUp(e)}/>
              </div>
            </div>
          </div>
        </div>
          {
            this.state.searchDataResult.users=== undefined ? [] : this.state.searchDataResult.users.map((users,i)=>{
              return (
                <SearchFeedUserFeedItem key={i} data={users}/>
              )
            })
          }

          {
            this.state.searchDataResult.activities === undefined ? [] : this.state.searchDataResult.activities.map((activity,i)=>{
              return (
                <ActivityFeedItem key={i} data={activity}/>
              )
            })
          }
          {
            this.state.searchDataResult.posts === undefined ? [] : this.state.searchDataResult.posts.map((post,i)=>{
              return (
                <SearchFeedPostFeedItem key={i} data={post}/>
              )
            })
          }
      </div>
    );
  }
}
