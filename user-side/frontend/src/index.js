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
                Last Update : 2021-03-16
            </p>
        </div>
        );
    }
}

class Connector extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            verb_gpu : Array(this.props.server.GPU.length).fill(false),
            verb_cpu : false,
        };
    }

    generate_GPU_status() {
        let result = [];
        for (let i=0; i < this.props.server.GPU.length; i++)
        {
            let gpu = this.props.server.GPU[i];
            let gpu_l = [];
            for (let j=0;j<7; j++)
            {
                if (!this.state.verb_gpu[i] && (j<3 || j===5))
                    continue;
                let l = Object.entries(gpu[j])[0];
                if (j < 4)
                {
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
                else
                {
                    var w = l[1].split(' ')[0];
                    var key = l[0];
                    var text = l[1];
                    if (j===6)
                    {
                        key = "Mem. Usage";
                        var w_ = Object.entries(gpu[7])[0][1].split(' ')[0];
                        text += " / " + w_ + " MiB";
                        w = (parseFloat(w) / parseFloat(w_)*100).toString();
                    }
                    gpu_l.push(
                        <div>
                            <div className='key'>
                                {key}
                            </div>
                            <div className='value-bar'>
                                <div className='value-bar-value'>
                                    {text}
                                </div>
                                <div style={{width:w+"%"}} className='value-bar-curr'>
                                </div>
                            </div>
                        </div>
                    );
                }
            }

            result.push(
                <div className='item-holder' onClick={() => this.toggle_GPU_verb(i)}>
                {gpu_l}
                </div>
            );
        }
        return result;
    }

    toggle_GPU_verb(index) {
        var verb_t = [...this.state.verb_gpu];
        verb_t[index]=!verb_t[index];
        this.setState({verb_gpu:verb_t});
    }
    
    generate_CPU_status() {
        if (!this.props.server.Valid)
            return [];
        var result = [];
        for (var i=0;i<this.props.server.CPU.length;i++)
        {
            if (!this.state.verb_cpu && i > 0)
                break;
            var name = Object.entries(this.props.server.CPU[i][0])[0][1];
            var idle = Object.entries(this.props.server.CPU[i][10])[0][1];
            var text = (100-parseFloat(idle)).toFixed(2) + " / 100 %";
            var w_used = (100-parseFloat(idle)).toString();
            result.push(
                <div style={{width:(i===0)?"100%":"48.5%",display:"inline-block"}}>
                    <div className='key'>
                        {(i===0)?"CPU":name}
                    </div>
                    <div className='value-bar'>
                        <div className='value-bar-value'>
                            {text}
                        </div>
                        <div style={{width:w_used+"%"}} className='value-bar-curr'>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className='item-holder' onClick={() => this.toggle_CPU_verb()}>
                {result}
            </div>
        );
    }

    toggle_CPU_verb() {
        this.setState({verb_cpu:!this.state.verb_cpu});
    }
    
    generate_MEMORY_status() {
        if (!this.props.server.Valid)
            return [];
        var total = Object.entries(this.props.server.MEMORY[0])[0][1];
        var used = Object.entries(this.props.server.MEMORY[1])[0][1];
        var cache = Object.entries(this.props.server.MEMORY[4])[0][1];
        var text = used + " / " + total + " MB";
        var w_used = (parseFloat(used) / parseFloat(total)*100).toString();
        var w_cache = (parseFloat(cache) / parseFloat(total)*100).toString();
        return (
            <div className='item-holder'>
                <div className='key'>
                    Memory
                </div>
                <div className='value-bar'>
                    <div className='value-bar-value'>
                        {text}
                    </div>
                    <div style={{width:w_used+"%"}} className='value-bar-curr'>
                    </div>
                    <div style={{width:w_cache+"%", backgroundColor:"#ffffbb"}} className='value-bar-curr'>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        return (
        <div className='connector'>
            <p className='server-name'>{this.props.server.Server}</p>
            {this.generate_CPU_status()}
            {this.generate_MEMORY_status()}
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
