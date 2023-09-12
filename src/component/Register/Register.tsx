import { useState } from "react";
import "./Register.css";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GoogleIcon from "@mui/icons-material/Google";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";


export default function Register() {
    const [Sign, setSign] = useState<boolean>(true);
    return (
        <div className={`main overflow-hidden min-h-screen bg-white w-full relative ${Sign ? "sign-up-mode" : ""} `}>
            <div className="forms-container">
                <div className="signin-signup">
                    <form className="sign-in-form">
                        <h2 className="title">Sign in</h2>
                        <div className="input-field">
                            <i className="fas fa-user" />
                            <input type="text" placeholder="Username" />
                        </div>

                        <div className="input-field">
                            <i className="fas fa-lock" />
                            <input type="password" placeholder="Password" />
                        </div>

                        <button type="submit" defaultValue="Login" className="btn bg-main-color" >Submit </button>

                        <p className="social-text">Or Sign in with social platforms</p>
                        <div className="social-media">
                            <a href="#" className="social-icon">
                                <FacebookIcon />
                            </a>
                            <a href="#" className="social-icon">
                                <TwitterIcon />
                            </a>
                            <a href="#" className="social-icon">
                                <GoogleIcon />
                            </a>
                            <a href="#" className="social-icon">
                                <LinkedInIcon />
                            </a>
                        </div>
                    </form>

                    <form className="sign-up-form">
                        <h2 className="title">Sign up</h2>
                        <div className="input-field">
                            <i className="fas fa-user" />
                            <input type="text" placeholder="Username" />
                        </div>
                        <div className="input-field">
                            <i className="fas fa-envelope" />
                            <input type="email" placeholder="Email" />
                        </div>
                        <div className="input-field">
                            <i className="fas fa-lock" />
                            <input type="password" placeholder="Password" />
                        </div>
                        <button
                            type="submit"
                            className="btn bg-main-color"
                            defaultValue="Sign up"
                        >
                            Submit
                        </button>
                        <p className="social-text">Or Sign up with social platforms</p>
                        <div className="social-media">
                            <a href="#" className="social-icon">
                                <FacebookIcon />
                            </a>
                            <a href="#" className="social-icon">
                                <TwitterIcon />
                            </a>
                            <a href="#" className="social-icon">
                                <GoogleIcon />
                            </a>
                            <a href="#" className="social-icon">
                                <LinkedInIcon />
                            </a>
                        </div>
                    </form>
                </div>
            </div>
            <div className="panels-container">
                <div className="panel left-panel">
                    <div className="content">
                        <h3>New here ?</h3>
                        <p>
                            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Debitis,
                            ex ratione. Aliquid!
                        </p>
                        <button className="btn transparent" onClick={() => setSign(true)}>
                            Sign up
                        </button>
                    </div>
                    <img src="log.svg" className="image" />
                </div>
                <div className="panel right-panel">
                    <div className="content">
                        <h3>One of us ?</h3>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrumlaboriosam ad deleniti.</p>
                        <button className="btn transparent" onClick={() => setSign(false)}>
                            Sign in
                        </button>
                    </div>
                    <img src="register.svg" className="image" />
                </div>
            </div>
        </div>
    );
}
