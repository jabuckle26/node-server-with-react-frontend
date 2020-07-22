import React, {Fragment, useState} from 'react'
import {Link} from 'react-router-dom';

export const Login = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password2: ''
    });

    const { email, password } = formData;

    const onChange = e => setFormData({...formData, [e.target.name]: e.target.value});

    const onSubmit = async e => {
        e.preventDefault();
        console.log('Success');
    }
        
    return (
        <Fragment>
        <h1 className="large text-primary">Log in to your account</h1>
        <form className="form" onSubmit={e => onSubmit(e)}>
            
            <div className="form-group">
                <input type="email" placeholder="Email Address" name="email" value={email} onChange={e => onChange(e)} />
                
            </div>
            <div className="form-group">
                <input
                    type="password"
                    placeholder="Password"
                    name="password"
                    minLength="6"
                    value={password} onChange={e => onChange(e)}
                />
            </div>
            
            <input type="submit" className="btn btn-primary" value="Register" />
        </form>
        <p className="my-1">
            Dont have an account yet? <Link to="/register">Sign Up</Link>
        </p>
        </Fragment>
    )
}

export default Login;