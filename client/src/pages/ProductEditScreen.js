import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Form, Button } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import { listProductDetails, updateProduct } from '../actions/productActions'
import { PRODUCT_UPDATE_RESET } from '../constants/productConstants'

const ProductEditScreen = () => {
  const { id: productId } = useParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [images, setImages] = useState([]) // mảng các url ảnh
  const [imageUrl, setImageUrl] = useState('') // state mới để chứa url ảnh nhập từ mạng
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [countInStock, setCountInStock] = useState(0)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)

  const dispatch = useDispatch()

  const productDetails = useSelector((state) => state.productDetails)
  const { loading, error, product } = productDetails

  const productUpdate = useSelector((state) => state.productUpdate)
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = productUpdate

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: PRODUCT_UPDATE_RESET })
      navigate('/seller/products')
    } else {
      if (!product.name || product._id !== productId) {
        dispatch(listProductDetails(productId))
      } else {
        setName(product.name)
        setPrice(product.price)
        setImages(product.images || [])
        setBrand(product.brand)
        setCategory(product.category)
        setCountInStock(product.countInStock)
        setDescription(product.description)
      }
    }
  }, [dispatch, navigate, productId, product, successUpdate])

  // Xử lý upload ảnh từ máy tính
  const uploadFileHandler = async (e) => {
    const files = Array.from(e.target.files)

    // Giới hạn tổng số ảnh ≤ 5
    if (files.length + images.length > 5) {
      alert('You can upload up to 5 images only')
      return
    }

    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })

    setUploading(true)

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }

      const { data } = await axios.post('/api/upload', formData, config)
      const newPaths = data.paths || []

      setImages((prev) => [...prev, ...newPaths])
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
      // Reset input file để có thể chọn lại file cũ nếu muốn
      e.target.value = null 
    }
  }

  // Xử lý thêm ảnh từ URL mạng
  const addImageUrlHandler = (e) => {
    e.preventDefault() // Ngăn form submit
    if (!imageUrl.trim()) return

    if (images.length >= 5) {
      alert('You can upload up to 5 images only')
      return
    }

    setImages((prev) => [...prev, imageUrl.trim()])
    setImageUrl('') // Reset ô input url
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(
      updateProduct({
        _id: productId,
        name,
        price,
        images,
        brand,
        category,
        description,
        countInStock,
      })
    )
  }

  return (
    <>
      <Link to='/seller/products' className='btn btn-light my-3'>
        Go Back
      </Link>
      <FormContainer>
        <h1>Edit Product</h1>
        {loadingUpdate && <Loader />}
        {errorUpdate && <Message variant='danger'>{errorUpdate}</Message>}
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>{error}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <Form.Group controlId='name'>
              <Form.Label>Name</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter name'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId='price'>
              <Form.Label>Price</Form.Label>
              <Form.Control
                type='number'
                placeholder='Enter price'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Form.Group>

            {/* --- KHU VỰC CHỈNH SỬA ẢNH --- */}
            <Form.Group controlId='images' className="mt-3">
              <Form.Label>Product Images (Max 5)</Form.Label>
              
              {/* Option 1: Upload từ máy */}
              <Form.Control
                type='file'
                multiple
                onChange={uploadFileHandler}
                disabled={images.length >= 5} // Khóa lại nếu đã đủ 5 ảnh
                className="mb-2"
              />
              {uploading && <Loader />}

              {/* Option 2: Add từ URL mạng */}
              <div className="d-flex align-items-center">
                <Form.Control
                  type='text'
                  placeholder='Enter Image URL'
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={images.length >= 5} // Khóa lại nếu đã đủ 5 ảnh
                />
                <Button 
                  variant="secondary" 
                  className="ms-2" 
                  onClick={addImageUrlHandler}
                  disabled={images.length >= 5 || !imageUrl.trim()}
                >
                  Add
                </Button>
              </div>

              {/* Khu vực Preview Ảnh */}
              <div
                className='image-preview-container'
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '15px',
                  flexWrap: 'wrap',
                }}
              >
                {images.map((img, index) => (
                  <div
                    key={index}
                    style={{ position: 'relative', width: '100px', height: '100px' }}
                  >
                    <img
                      src={img}
                      alt={`Preview ${index}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        border: '1px solid #ccc',
                      }}
                    />
                    <Button
                      variant='danger'
                      size='sm'
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        padding: '0 6px',
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </Form.Group>
            {/* --- KẾT THÚC KHU VỰC CHỈNH SỬA ẢNH --- */}

            <Form.Group controlId='brand' className="mt-3">
              <Form.Label>Brand</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter brand'
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId='countInStock' className="mt-3">
              <Form.Label>Count In Stock</Form.Label>
              <Form.Control
                type='number'
                placeholder='Enter countInStock'
                value={countInStock}
                onChange={(e) => setCountInStock(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId='category' className="mt-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter category'
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId='description' className="mt-3 mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as='textarea'
                rows={3}
                placeholder='Enter description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>

            <Button type='submit' variant='primary'>
              Update
            </Button>
          </Form>
        )}
      </FormContainer>
    </>
  )
}

export default ProductEditScreen