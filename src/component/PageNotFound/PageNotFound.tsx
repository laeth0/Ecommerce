import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button/Button'
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { useNavigate } from 'react-router-dom';


export default function PageNotFound() {

    const navigate = useNavigate()

    return (
        <section className="bg-white dark:bg-gray-900 ">
            <div className="container min-h-screen px-6 py-12 mx-auto lg:flex lg:items-center lg:gap-12">

                <div className="wf-ull lg:w-1/2">
                    <Typography variant="body1" className='text-sm font-medium text-blue-500 dark:text-blue-400'>404 error</Typography>
                    <Typography variant="h1" className='mt-3 text-2xl font-semibold text-gray-800 dark:text-white md:text`-3xl'>Page not found</Typography>
                    <Typography variant="body1" className='mt-4 text-gray-500 dark:text-gray-400'>Sorry, the page you are looking for doesn't exist.Here are some helpful links</Typography>
                    <div className="flex items-center mt-6 gap-x-3">
                        <Button variant="outlined" startIcon={<ArrowRightAltIcon className='rotate-180' />} onClick={() => navigate(-1)}>Go back</Button>
                        <Button variant="contained" className='bg-blue-500' onClick={() => navigate('/')}>Take me Home</Button>
                    </div>
                </div>

                <div className="relative w-full mt-12 lg:w-1/2 lg:mt-0">
                    <img className="w-full max-w-lg lg:mx-auto" src="pageNotFound.svg" alt="page Not Found" />
                </div>
            </div>
        </section>

    )
}


