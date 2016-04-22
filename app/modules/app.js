import React, { Component } from 'react'

export default class App extends Component {
    render() {
        return (
            <div style={{height: '100%'}}>
                <div className="app-wrapper flex flex-column">
                    {this.props.children}
                </div>
            </div>
        )
    }
}