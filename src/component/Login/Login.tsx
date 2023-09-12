import { Formik, Form, Field, ErrorMessage } from 'formik';
import { object, string, } from 'yup';
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react'
import axios from 'axios';
import './Login.css'

export default function Login() {

    const navigate = useNavigate()

    const [cookies, setCookie] = useCookies(['user_token']);

    // useEffect(() => {
    //   if (cookies.user_token)
    //     navigate('/')
    // }, []);

    const initialValues: { username: string, password: string } = { username: "kminchelle", password: "0lelplR" }

    const onSubmit = (values: { username: string, password: string }) => {
        axios.post('https://dummyjson.com/auth/login', { username: values.username, password: values.password })
            .then(res => {
                setCookie('user_token', res.data.token, { path: '/', maxAge: 604800 });// maxAge (number): relative max age of the cookie from when the client receives it in seconds =>604 800 equal week
                navigate('/')
            })
            .catch(err => console.log(err))
    }

    const validationSchema = object({
        username: string().min(3, 'should enter more than 3 character').max(10, 'Must be 10 characters or less').required('Required'),
        password: string().min(7, "should enter more than 7 character").max(20, 'Must be 20 characters or less').required('Required'),
    })


    return (
        <section className="relative min-h-screen flex ">
            <div className="flex flex-auto  justify-center">

                <div className="sm:w-1/2 xl:w-2/5 h-full hidden lg:flex flex-auto items-center justify-start p-10 overflow-hidden bg-purple-900 text-white bg-no-repeat bg-cover relative" >
                    <div className="absolute bg-gradient-to-b from-blue-900 to-gray-900 opacity-75 inset-0 z-0" />
                    <div className="absolute triangle min-h-screen right-0 w-16" />
                    <span className="flex absolute top-5  text-gray-100 ">
                        <img src="favicon.png" alt="VOXO" className="mx-2 w-8 h-8 imageRotation" />
                        <p className="text-2xl font-black">VOXO</p>
                    </span>
                    <img src="login.png" className="h-96 absolute right-5 " />
                    <div className="max-w-md z-10">
                        <div className="sm:text-4xl xl:text-5xl font-bold leading-tight mb-6">Welcome to voxo </div>
                        <div className="sm:text-sm xl:text-md text-gray-200 font-normal">We're thrilled to have you here. Please sign in to access your account and explore our exciting range of products. Whether you're shopping for the latest fashion trends, high-tech gadgets, or unique gifts, we've got something special for you.</div>
                    </div>
                    <ul className="circles">
                        <li />
                        <li />
                        <li />
                        <li />
                        <li />
                        <li />
                        <li />
                        <li />
                        <li />
                        <li />
                    </ul>
                </div>

                <div className="md:flex md:items-center md:justify-center w-full sm:w-auto md:h-full  xl:w-2/5 p-8  md:p-10 lg:p-14 sm:rounded-lg md:rounded-none bg-white ">
                    <div className="max-w-md w-full space-y-8">

                        <div className="text-center">
                            <h2 className="mt-6 text-3xl font-bold text-gray-900">
                                Welcom Back!
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">Please sign in to your account</p>
                        </div>

                        <div className="flex flex-row justify-center items-center space-x-3">
                            <span className="w-11 h-11 items-center justify-center inline-flex rounded-2xl font-bold text-lg  bg-blue-900 hover:shadow-lg cursor-pointer transition ease-in duration-300"><img className="w-4 h-4" src="facebook.svg" /></span>
                            <span className="w-11 h-11 items-center justify-center inline-flex rounded-2xl font-bold text-lg  text-white bg-blue-400 hover:shadow-lg cursor-pointer transition ease-in duration-300"><img className="w-4 h-4" src="twiter.svg" /></span>
                            <span className="w-11 h-11 items-center justify-center inline-flex rounded-2xl font-bold text-lg  text-white bg-blue-500 hover:shadow-lg cursor-pointer transition ease-in duration-300"><img src="linkedin.svg" className="w-4 h-4" /></span>
                        </div>

                        <div className="flex items-center justify-center space-x-2">
                            <span className="h-px w-16 bg-gray-200" />
                            <span className="text-gray-300 font-normal">or continue with</span>
                            <span className="h-px w-16 bg-gray-200" />
                        </div>

                        <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={validationSchema}>
                            <Form className="mt-8 space-y-6">
                                <div className="relative">
                                    <label className="ml-3 text-sm font-bold text-gray-700 tracking-wide">User Name</label>
                                    <Field name="username" className=" w-full text-base px-4 py-2 border-b border-gray-300 focus:outline-none rounded-2xl focus:border-indigo-500" placeholder="User Name" />
                                    <ErrorMessage name='username' >{(errorMsg) => <div className='text-red-900 mt-1'>{errorMsg}</div>}</ErrorMessage>
                                </div>

                                <div className="mt-8 content-center">
                                    <label className="ml-3 text-sm font-bold text-gray-700 tracking-wide">Password</label>
                                    <Field name="password" className="w-full content-center text-base px-4 py-2 border-b rounded-2xl border-gray-300 focus:outline-none focus:border-indigo-500" placeholder="Enter your password" />
                                    <ErrorMessage name='password' >{(errorMsg) => <div className='text-red-900 mt-1'>{errorMsg}</div>}</ErrorMessage>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input id="remember_me" name="remember_me" type="checkbox" defaultChecked className="h-4 w-4 bg-blue-500 focus:ring-blue-400 border-gray-300 rounded" />
                                        <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">Remember me</label>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-indigo-400 hover:text-blue-500 cursor-pointer">Forgot your password?</span>
                                    </div>
                                </div>

                                <button type="submit" className="w-full flex justify-center bg-gradient-to-r from-indigo-500 to-blue-600  hover:bg-gradient-to-l hover:from-blue-500 hover:to-indigo-600 text-gray-100 p-4  rounded-full tracking-wide font-semibold  shadow-lg cursor-pointer transition ease-in duration-500">Sign in</button>

                                <div className="flex flex-col items-center justify-center mt-10 text-center text-md text-gray-500">
                                    <span className='cursor-pointer'>Don't have an account?</span>
                                    <span className="text-indigo-400 hover:text-blue-500 no-underline hover:underline cursor-pointer transition ease-in duration-300">Sign up</span>
                                </div>

                            </Form>
                        </Formik>
                    </div>
                </div>

            </div>
        </section>
    )
}
