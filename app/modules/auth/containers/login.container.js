import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom';
import { connect } from 'react-redux'
import classNames from 'classnames';
import Immutable from 'immutable';


class Login extends Component {
    constructor(props){
        super(props);

        this.state = {

        }
    }

    render(){
        return <div></div>
    }
}

function select(state, ownProps) {
    return {
        //recipeId: ownProps.params.recipeId,
    }
}

export default connect(select)(Login);