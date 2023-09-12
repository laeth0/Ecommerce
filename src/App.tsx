import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { CookiesProvider } from 'react-cookie';
import Home from './component/Home/Home';
import Login from './component/Login/Login';
import PageNotFound from './component/PageNotFound/PageNotFound';
import Register from './component/Register/Register';
import Cart from './component/Cart/Cart';
import SingleProduct from './component/SingleProduct/SingleProduct';
import MainHomeContent from './component/MainHomeContent/MainHomeContent';
import Favorite from './component/Favorite/Favorite';

export default function App() {

  return (
    <CookiesProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} >
            <Route index element={<MainHomeContent />} />
            <Route path='/Cart' element={<Cart />} />
            <Route path='/Favorite' element={<Favorite />} />
            <Route path='/Product/:id' element={<SingleProduct />} />
          </Route>
          <Route path='/Login' element={<Login />} />
          <Route path='/Register' element={<Register />} />
          <Route path='*' element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
    </CookiesProvider >
  )
}

