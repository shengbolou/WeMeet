import React from 'react';
var emojione = require('emojione')

export default class ChatEntry extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            text: ""
        }
    }

    handleChange(e){
        e.preventDefault();
        this.setState({text: emojione.shortnameToUnicode(e.target.value)})
    }

    handleSubmit(e){
        e.preventDefault();
        if(e.key === "Enter" || e.button===0){
            if(this.state.text.trim() !== ""){
                this.setState({text:""});
                this.props.onPost(this.state.text);
            }
        }
    }
    componentDidMount(){
        $('#chattext').jemoji({
            folder: 'emojis/',
            btn: $('#openchatemoji'),
            container:  $('#chattext').parent().parent(),
            navigation:false
        });
    }

    render(){
        return(
            <div className="panel-footer">
                <div className="row">
                    <div className="col-md-10 col-xs-10 col-sm-10">
                        <textarea id="chattext" className="form-control msg nohover non-active" name="name" rows="5" value={this.state.text}
                        onChange={(e)=>this.handleChange(e)} onFocus={(e)=>this.handleChange(e)} cols="40" placeholder="please type text"
                        onKeyUp={(e) => this.handleSubmit(e)}></textarea>

                        <div className="btn-group" role="group" aria-label="...">
                            <label htmlFor="pic" style={{marginRight:'20px'}}>
                                <a><i className="fa fa-camera" aria-hidden="true"></i></a>
                            </label>
                            <input type="file" accept=".jpg,.jpeg,.png,.gif" id="pic" multiple></input>
                            <a id="openchatemoji"><span><i className="fa fa-lg fa-smile-o" aria-hidden="true"></i></span></a>
                        </div>
                    </div>
                    <div className="col-md-2 col-sm-2 col-xs-2 send">
                        <button type="button" className="btn btn-default btn-blue-grey pull-right" name="button"
                        onClick={(e)=>this.handleSubmit(e)}>Send</button>
                    </div>
                </div>
            </div>
        )
    }
}
