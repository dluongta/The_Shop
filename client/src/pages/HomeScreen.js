import React, { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Container } from 'react-bootstrap'
import Message from '../components/Message'
import Loader from '../components/Loader'
import Paginate from '../components/Paginate'
import Meta from '../components/Meta'
import { listProducts } from '../actions/productActions'
//import Carousel from '../components/homePage/Carousel'
import LatestProducts from '../components/homePage/LatestProducts'
import ProductCarousel from '../components/ProductCarousel'
import SearchBar from '../layout/SearchBar';

const HomeScreen = () => {
  // Use useParams to access the route parameters in v6
  const { keyword, pageNumber = 1 } = useParams()  // default pageNumber to 1 if undefined

  const dispatch = useDispatch()

  const productList = useSelector((state) => state.productList)
  const { loading, error, page, pages } = productList

  useEffect(() => {
    dispatch(listProducts(keyword, pageNumber))
  }, [dispatch, keyword, pageNumber])

  return (
    <>
      <Meta />
      <SearchBar/>
      {!keyword ? (
        <>
          <Container>
            <h1>Top Products</h1>
            <ProductCarousel />
          </Container>
        </>
      ) : (
        <div className='container'>
          <Link to='/' className='btn btn-light'>
            Go Back
          </Link>
        </div>
      )}
      <Container>
        <h1>Latest Products</h1>
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>{error}</Message>
        ) : (
          <>
            <LatestProducts />
            <Paginate
              pages={pages}
              page={page}
              keyword={keyword ? keyword : ''}
            />
          </>
        )}
      </Container>
    </>
  )
}

export default HomeScreen
