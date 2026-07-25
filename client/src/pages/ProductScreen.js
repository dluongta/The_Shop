import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Row,
  Col,
  Image,
  ListGroup,
  Card,
  Button,
  Form,
  Container,
} from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Rating from '../components/Rating';
import Message from '../components/Message';
import Loader from '../components/Loader';
import Meta from '../components/Meta';
import {
  listProductDetails,
  createProductReview,
} from '../actions/productActions';
import { PRODUCT_CREATE_REVIEW_RESET } from '../constants/productConstants';

const ProductScreen = () => {
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const productReviewCreate = useSelector((state) => state.productReviewCreate);
  const {
    success: successProductReview,
    loading: loadingProductReview,
    error: errorProductReview,
  } = productReviewCreate;

  // ==========================================
  // LOGIC CUSTOM CAROUSEL (BẮT ĐẦU)
  // ==========================================
  const [currentIndex, setCurrentIndex] = useState(1);
  const [transition, setTransition] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const startX = useRef(0);
  const isDragging = useRef(false);
  const timerRef = useRef(null);

  // Lấy danh sách ảnh từ product (nếu có)
  const images = product?.images || [];
  const totalSlides = images.length;

  const nextSlide = useCallback(() => {
    if (isAnimating || totalSlides <= 1) return;
    setIsAnimating(true);
    setTransition(true);
    setCurrentIndex((prev) => prev + 1);
  }, [isAnimating, totalSlides]);

  const prevSlide = () => {
    if (isAnimating || totalSlides <= 1) return;
    setIsAnimating(true);
    setTransition(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const goToSlide = (index) => {
    if (isAnimating || currentIndex === index + 1) return;
    setIsAnimating(true);
    setTransition(true);
    setCurrentIndex(index + 1);
  };

  // Tự động chuyển slide sau 3s
  useEffect(() => {
    if (totalSlides > 1) {
      timerRef.current = setInterval(() => {
        if (!isDragging.current) nextSlide();
      }, 3000);
    }
    return () => clearInterval(timerRef.current);
  }, [nextSlide, totalSlides]);

  const handleTransitionEnd = () => {
    setIsAnimating(false);
    if (currentIndex === totalSlides + 1) {
      setTransition(false);
      setCurrentIndex(1);
    }
    if (currentIndex === 0) {
      setTransition(false);
      setCurrentIndex(totalSlides);
    }
  };

  const getActiveDot = () => {
    if (currentIndex === 0) return totalSlides - 1;
    if (currentIndex === totalSlides + 1) return 0;
    return currentIndex - 1;
  };

  const handleStart = (clientX) => {
    startX.current = clientX;
    isDragging.current = true;
  };

  const handleEnd = (clientX) => {
    if (!isDragging.current || totalSlides <= 1) return;
    const diff = clientX - startX.current;
    if (Math.abs(diff) > 50) {
      diff > 0 ? prevSlide() : nextSlide();
    }
    isDragging.current = false;
  };

  // Mảng clone để tạo hiệu ứng lặp vô tận
  const slides =
    totalSlides > 1
      ? [images[totalSlides - 1], ...images, images[0]]
      : images;

  // Style cho nút mũi tên
  const btnStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    width: '45px',
    height: '45px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    zIndex: 10,
    opacity: 1,
    padding: 0,
  };

  const arrowIconStyle = {
    filter: 'brightness(200%) drop-shadow(0px 0px 2px rgba(255, 255, 255, 0.8))',
    fontSize: '20px',
    color: 'white',
    fontWeight: 'bold',
  };
  // ==========================================
  // LOGIC CUSTOM CAROUSEL (KẾT THÚC)
  // ==========================================

  // Reset Form Review & Load Product
  useEffect(() => {
    if (successProductReview) {
      setRating(0);
      setComment('');
    }
    if (!product._id || product._id !== id) {
      dispatch(listProductDetails(id));
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET });
    }
  }, [dispatch, id, successProductReview, product._id]);

  const addToCartHandler = () => {
    navigate(`/cart/${id}`);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(
      createProductReview(id, {
        rating,
        comment,
      })
    );
  };

  return (
    <Container>
      <Link className='btn btn-light my-3' to='/'>
        Go Back
      </Link>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          <Meta title={product.name} />
          <Row>
            <Col md={6}>
              {/* KHU VỰC HIỂN THỊ ẢNH & CAROUSEL */}
              {totalSlides > 0 ? (
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
                  
                  {/* Băng chuyền Flexbox */}
                  <div
                    style={{
                      display: 'flex',
                      transform: totalSlides > 1 ? `translateX(-${currentIndex * 100}%)` : 'translateX(0)',
                      transition: transition ? 'transform 0.5s ease-in-out' : 'none',
                      width: '100%',
                    }}
                    onTransitionEnd={handleTransitionEnd}
                    onMouseDown={(e) => handleStart(e.clientX)}
                    onMouseUp={(e) => handleEnd(e.clientX)}
                    onMouseLeave={(e) => handleEnd(e.clientX)}
                    onTouchStart={(e) => handleStart(e.touches[0].clientX)}
                    onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
                  >
                    {slides.map((img, idx) => (
                      <div
                        key={idx}
                        style={{ flex: '0 0 100%', width: '100%', position: 'relative' }}
                      >
                        <Image
                          src={img}
                          alt={`Product Image ${idx}`}
                          fluid
                          style={{ width: '100%', objectFit: 'cover' }}
                          draggable={false}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Nút Trái/Phải & Chấm điều hướng (Chỉ hiện khi có > 1 ảnh) */}
                  {totalSlides > 1 && (
                    <>
                      <button style={{ ...btnStyle, left: '15px' }} onClick={prevSlide} disabled={isAnimating}>
                        <span style={arrowIconStyle}>&#10094;</span>
                      </button>
                      <button style={{ ...btnStyle, right: '15px' }} onClick={nextSlide} disabled={isAnimating}>
                        <span style={arrowIconStyle}>&#10095;</span>
                      </button>

                      {/* Chấm điều hướng hình chữ nhật + Nền đen mờ */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '15px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: '8px',
                          zIndex: 15,
                          backgroundColor: 'rgba(0, 0, 0, 0.6)', // Nền đen mờ bọc các chấm
                          padding: '8px 12px',
                          borderRadius: '6px',
                        }}
                      >
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              goToSlide(idx);
                            }}
                            style={{
                              width: '30px',
                              height: '8px', 
                              backgroundColor: '#fff',
                              border: 'none',
                              padding: 0,
                              opacity: getActiveDot() === idx ? 1 : 0.4,
                              transition: 'opacity 0.3s ease',
                              cursor: 'pointer',
                              borderRadius: '4px', 
                            }}
                            aria-label={`Slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Nếu sản phẩm hoàn toàn không có ảnh nào, dùng ảnh mẫu
                <Image src='/images/sample.jpg' alt={product.name} fluid />
              )}
            </Col>

            {/* THÔNG TIN SẢN PHẨM */}
            <Col md={3}>
              <ListGroup variant='flush'>
                <ListGroup.Item>
                  <h3>{product.name}</h3>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Rating
                    value={product.rating}
                    text={`${product.numReviews} reviews`}
                  />
                </ListGroup.Item>
                <ListGroup.Item>Price: ${product.price}</ListGroup.Item>
                <ListGroup.Item>
                  Description: {product.description}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Seller: </strong>
                  {product.user ? product.user.name : 'Not available'}
                </ListGroup.Item>
              </ListGroup>
            </Col>

            {/* CARD THÊM VÀO GIỎ HÀNG */}
            <Col md={3}>
              <Card>
                <ListGroup variant='flush'>
                  <ListGroup.Item>
                    <Row>
                      <Col>Price:</Col>
                      <Col>
                        <strong>${product.price}</strong>
                      </Col>
                    </Row>
                  </ListGroup.Item>

                  <ListGroup.Item>
                    <Row>
                      <Col>Status:</Col>
                      <Col>
                        {product.countInStock > 0 ? (
                          <>
                            In Stock ({product.countInStock}{' '}
                            {product.countInStock === 1 ? 'item' : 'items'} left)
                          </>
                        ) : (
                          <span style={{ color: 'red' }}>Out Of Stock</span>
                        )}
                      </Col>
                    </Row>
                  </ListGroup.Item>

                  {product.countInStock > 0 && (
                    <ListGroup.Item>
                      <Row>
                        <Col>Qty</Col>
                        <Col>
                          <Form.Control
                            as='select'
                            value={qty}
                            onChange={(e) => setQty(Number(e.target.value))}
                          >
                            {[...Array(product.countInStock).keys()].map(
                              (x) => (
                                <option key={x + 1} value={x + 1}>
                                  {x + 1}
                                </option>
                              )
                            )}
                          </Form.Control>
                          {product.countInStock <= 5 && (
                            <div style={{ color: 'orange', fontSize: '0.9rem' }}>
                              Only {product.countInStock} left in stock – order soon!
                            </div>
                          )}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  )}

                  <ListGroup.Item>
                    <Button
                      onClick={addToCartHandler}
                      className='btn-block w-100'
                      type='button'
                      disabled={product.countInStock === 0}
                    >
                      Add To Cart
                    </Button>
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>
          </Row>

          {/* REVIEWS SECTION */}
          <Row className='mt-5'>
            <Col md={6}>
              <h2>Reviews</h2>
              {product.reviews.length === 0 && <Message>No Reviews</Message>}
              <ListGroup variant='flush'>
                {product.reviews.map((review) => (
                  <ListGroup.Item key={review._id}>
                    <strong>{review.name}</strong>
                    <Rating value={review.rating} />
                    <p>{review.createdAt.substring(0, 10)}</p>
                    <p>{review.comment}</p>
                  </ListGroup.Item>
                ))}
                <ListGroup.Item>
                  <h2>Write a Customer Review</h2>
                  {successProductReview && (
                    <Message variant='success'>
                      Review submitted successfully
                    </Message>
                  )}
                  {loadingProductReview && <Loader />}
                  {errorProductReview && (
                    <Message variant='danger'>{errorProductReview}</Message>
                  )}
                  {userInfo ? (
                    <Form onSubmit={submitHandler}>
                      <Form.Group controlId='rating' className='my-2'>
                        <Form.Label>Rating</Form.Label>
                        <Form.Control
                          as='select'
                          value={rating}
                          onChange={(e) => setRating(Number(e.target.value))}
                        >
                          <option value=''>Select...</option>
                          <option value='1'>1 - Poor</option>
                          <option value='2'>2 - Fair</option>
                          <option value='3'>3 - Good</option>
                          <option value='4'>4 - Very Good</option>
                          <option value='5'>5 - Excellent</option>
                        </Form.Control>
                      </Form.Group>

                      <Form.Group controlId='comment' className='my-2'>
                        <Form.Label>Comment</Form.Label>
                        <Form.Control
                          as='textarea'
                          rows='3'
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        ></Form.Control>
                      </Form.Group>

                      <Button
                        disabled={loadingProductReview}
                        type='submit'
                        variant='primary'
                      >
                        Submit
                      </Button>
                    </Form>
                  ) : (
                    <Message>
                      Please <Link to='/login'>sign in</Link> to write a review
                    </Message>
                  )}
                </ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default ProductScreen;