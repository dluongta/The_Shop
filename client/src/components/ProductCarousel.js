import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Image } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Loader from './Loader';
import Message from './Message';
import { listTopProducts } from '../actions/productActions';

const ProductCarousel = () => {
  const dispatch = useDispatch();

  // Lấy data từ Redux
  const productTopRated = useSelector((state) => state.productTopRated);
  const { loading, error, products } = productTopRated;

  // State cho Custom Slider
  const [currentIndex, setCurrentIndex] = useState(1);
  const [transition, setTransition] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const startX = useRef(0);
  const isDragging = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    dispatch(listTopProducts());
  }, [dispatch]);

  const totalSlides = products ? products.length : 0;

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

  // Hàm chuyển đến slide cụ thể khi click vào các dot
  const goToSlide = (index) => {
    if (isAnimating || currentIndex === index + 1) return;
    setIsAnimating(true);
    setTransition(true);
    setCurrentIndex(index + 1);
  };

  // Tự động chuyển slide sau mỗi 3 giây
  useEffect(() => {
    if (totalSlides > 1) {
      timerRef.current = setInterval(() => {
        if (!isDragging.current) nextSlide();
      }, 3000);
    }
    return () => clearInterval(timerRef.current);
  }, [nextSlide, totalSlides]);

  // Xử lý tạo hiệu ứng lặp vô tận (Infinite Loop)
  const handleTransitionEnd = () => {
    setIsAnimating(false);
    if (currentIndex === totalSlides + 1) {
      setTransition(false);
      setCurrentIndex(1); // Giật về thật nhanh
    }
    if (currentIndex === 0) {
      setTransition(false);
      setCurrentIndex(totalSlides);
    }
  };

  // Tính toán index của dot đang được active
  const getActiveDot = () => {
    if (currentIndex === 0) return totalSlides - 1;
    if (currentIndex === totalSlides + 1) return 0;
    return currentIndex - 1;
  };

  // Xử lý thao tác kéo/vuốt (Drag/Swipe)
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

  // Render Loader hoặc Error trước khi có data
  if (loading) return <Loader />;
  if (error) return <Message variant='danger'>{error}</Message>;
  if (!products || products.length === 0) return null;

  // Tạo mảng clone để làm hiệu ứng trượt nối tiếp vô tận
  const slides = totalSlides > 1 
    ? [products[totalSlides - 1], ...products, products[0]] 
    : products;

  // === STYLE TUỲ CHỈNH ===
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
    border: '1px solid rgba(0, 0, 0, 0.95)',
    cursor: 'pointer',
    zIndex: 10,
    opacity: 1, 
    padding: 0
  };

  const arrowIconStyle = {
    filter: 'brightness(200%) drop-shadow(0px 0px 2px rgba(255, 255, 255, 0.8))',
    fontSize: '20px',
    color: 'white',
    fontWeight: 'bold'
  };

  return (
    <div className='bg-dark' style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* KHUNG CHỨA CÁC SLIDE NẰM NGANG */}
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
        {slides.map((product, index) => (
          <div 
            key={`${product._id}-${index}`} 
            style={{ flex: '0 0 100%', width: '100%', textAlign: 'center', position: 'relative' }}
          >
            <Link to={`/product/${product._id}`}>
              <Image 
                src={product.images[0]} 
                alt={product.name} 
                fluid 
                style={{ height: '400px', objectFit: 'cover', width: '100%' }}
                draggable={false}
              />
              <div className='carousel-caption' style={{ position: 'absolute', bottom: '60px', left: '10%', right: '10%' }}>
                <h2 style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '10px 20px', display: 'inline-block', borderRadius: '4px', color: '#fff' }}>
                  {product.name} (${product.price})
                </h2>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* ĐIỀU HƯỚNG TRÁI/PHẢI VÀ DOTS (Chỉ hiển thị khi có > 1 sản phẩm) */}
      {totalSlides > 1 && (
        <>
          {/* Mũi tên trái */}
          <button style={{ ...btnStyle, left: '20px' }} onClick={prevSlide} disabled={isAnimating}>
            <span style={arrowIconStyle}>&#10094;</span>
          </button>

          {/* Mũi tên phải */}
          <button style={{ ...btnStyle, right: '20px' }} onClick={nextSlide} disabled={isAnimating}>
            <span style={arrowIconStyle}>&#10095;</span>
          </button>

          {/* Chấm điều hướng (Hình chữ nhật) + Nền đen mờ */}
          <div style={{
            position: 'absolute',
            bottom: '15px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            zIndex: 15,
            backgroundColor: 'rgba(0, 0, 0, 0.6)', // Hình chữ nhật màu đen mờ bọc ngoài
            padding: '8px 12px', // Tạo không gian xung quanh các chấm
            borderRadius: '6px' // Bo tròn góc nền đen
          }}>
            {products.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  goToSlide(index);
                }}
                style={{
                  width: '30px',    
                  height: '8px',    
                  backgroundColor: '#fff',
                  border: 'none',
                  padding: 0,
                  opacity: getActiveDot() === index ? 1 : 0.4, 
                  transition: 'opacity 0.3s ease',
                  cursor: 'pointer',
                  borderRadius: '4px' 
                }}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

    </div>
  );
};

export default ProductCarousel;