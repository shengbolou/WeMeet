import React from 'React';
import {hideElement} from '../../utils'
import Avatar from '@material-ui/core/Avatar';
import Divider from '@material-ui/core/Divider';
import Icon from '@material-ui/core/Icon';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';


export default class ChatNavChatItem extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            online:false
        }
    }

    handleClick(e){
        e.preventDefault();
        this.props.switchUser(this.props.data);
    }


    render() {
        var icon = this.props.data.online?
        <Icon className="fas fa-circle" style={{color:'green',fontSize:'20px'}}/>:
        <Icon className="far fa-circle" style={{fontSize:'20px'}}/>;
        let lastmessage = this.props.lastmessage;
        var messagePreview = "";
        if(lastmessage !== undefined && Object.keys(lastmessage).length !== 0){
            if(lastmessage.text.length===0&&lastmessage.imgs.length!==0){
                messagePreview = "[Image]"
            }
            else if(lastmessage.text.length < 60){
                messagePreview = lastmessage.text;
            }
            else {
                messagePreview = lastmessage.text.substring(0,60)+'...';
            }
        }

        return (
            <div>
                <ListItem button onClick={(e)=>this.handleClick(e)}
                    style={{
                    alignItems: "flex-start"
                    }}>
                    <ListItemAvatar
                    style={{
                        marginTop: "20px"
                    }}>
                            <Avatar src={this.props.data.avatar}/>
                    </ListItemAvatar>
                    <ListItemText
                    primary={this.props.data.fullname}
                    secondary={
                        <span>
                            {messagePreview}
                            <span className={"label label-danger "+
                            hideElement(this.props.lastmessage===undefined||
                            Object.keys(this.props.lastmessage).length===0||
                            this.props.lastmessage.isread ||
                            this.props.lastmessage.sender===this.props.currentUser)}
                            style={{marginLeft:5}}>New</span>
                        </span>
                    }
                    />
                    <ListItemSecondaryAction style={{marginRight:'10px'}}>
                        {icon}
                    </ListItemSecondaryAction>
                </ListItem>
                <Divider inset/>
            </div>
        )
    }

}
