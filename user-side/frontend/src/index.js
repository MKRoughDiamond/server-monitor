import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class Title extends React.Component {
    render() {
        return (
        <div className='title'>
            <div className='title-n'>
                <h3>Server Monitor</h3>
            </div>
            <div className='title-input-div'>
                PASSWORD :
                <input type='password' id='input-password'/>
                <button id='input-button' onClick={this.props.handler}>Apply</button>
            </div>
        </div>
        );
    }
}
class Footer extends React.Component {
    render() {
        return (
        <div className='footer'>
            <p className='footer-p'>
                Maintained By : 최원석<br/>
                Last Update : 2021-03-08
            </p>
        </div>
        );
    }
}

class Connector extends React.Component {

    generate_GPU_status() {
        let result = [];
        for (let i=0; i < this.props.server.GPU.length; i++)
        {
            let gpu = this.props.server.GPU[i];
            let gpu_l = [];
            for (let j=0;j< gpu.length; j++)
            {
                let l = Object.entries(gpu[j])[0];
                gpu_l.push(
                    <div>
                        <div className='key'>
                            {l[0]}
                        </div>
                        <div className='value'>
                            {l[1]}
                        </div>
                    </div>
                );
            }
            result.push(
                <div className='gpu'>
                {gpu_l}
                </div>
            );
        }
        return result;
    }

    render() {
        return (
        <div className='connector'>
            <p className='server-name'>{this.props.server.Server}</p>
            {this.generate_GPU_status()}
        </div>
        );
    }
}

class Main extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            refresh : false,
            servers : [],
            counter : 0,
            password: ""
        };

        this.submit_key_handler = this.submit_key.bind(this);
    }

    update() {
        if (this.state.counter >= 5)
        {
            this.setState({refresh:false,password:""}, () =>{
                document.getElementById('input-password').removeAttribute('disabled');
                document.getElementById('input-button').removeAttribute('disabled');
            });
        }
        else
        {
            if (this.state.refresh)
            {
                let main = this;
                setTimeout(
                    () => {
                        fetch ('http://147.46.215.63:37373', {
                            method: 'POST',
                            body: JSON.stringify({'token':this.state.password}),
                        })
                        .then(function (response) {
                            if (response.ok)
                                return response.json();
                            else
                                return {'content':[]};
                        })
                        .then(function (data) {
                            main.setState({servers: data.content}, ()=>{main.update()});
                        })
                        .catch(function (err) {
                            main.setState({counter : main.state.counter+1}, ()=>{main.update()});
                            console.log(err);
                        });
                    },
                    5000
                );
            }
        }
    }

    submit_key() {
        var password = document.getElementById('input-password');
        var button = document.getElementById('input-button');
        this.setState({password:password.value, refresh: true}, () => {
            password.value="";
            password.setAttribute('disabled','disabled');
            button.setAttribute('disabled','disabled');
            this.update();
        });
    }

    generate_connectors() {
        return (
            <div className='connectors-div'>
                {this.state.servers.map((t) =>{ return <Connector server={t} />})}
            </div>
        );
    }

    render() {
        return (
            <div>
                <Title handler={this.submit_key_handler} />
                {this.generate_connectors()}
                <Footer />
            </div>
        );
    }
}

ReactDOM.render(
    <Main />,
    document.getElementById('root')
);
