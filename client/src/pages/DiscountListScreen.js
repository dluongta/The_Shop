import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Button } from 'react-bootstrap';
import Message from '../components/Message';  
import { getDiscounts } from '../actions/discountActions';

const DiscountListScreen = () => {
  const dispatch = useDispatch();

  const discountList = useSelector((state) => state.discountList || {});
  const { discounts = [], loading, error } = discountList;

  useEffect(() => {
    dispatch(getDiscounts());  
  }, [dispatch]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        alert('Discount code copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy discount code');
      });
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div>
      <h1>Available Discount Codes</h1>

      {loading && <Message variant="info">Loading...</Message>}  
      {error && <Message variant="danger">{error}</Message>}    

      <Row>
        {discounts.length > 0 ? (
          discounts.map((discount) => (
            <Col key={discount._id} sm={12} md={6} lg={4}>
              <Card className="my-3">
                <Card.Body>
                  <Card.Title>{discount.code}</Card.Title>
                  <Card.Text>
                    {discount.description}
                    <br />
                    {/* Kiểm tra discountType để render định dạng hiển thị phù hợp */}
                    Discount: {
                      discount.discountType === 'fixed' 
                        ? formatCurrency(discount.amount) 
                        : `${discount.amount}%`
                    }
                  </Card.Text>
                  <Button
                    variant="primary"
                    onClick={() => handleCopyCode(discount.code)}  
                  >
                    Copy Code
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Message>No discount codes available</Message>
        )}
      </Row>
    </div>
  );
};

export default DiscountListScreen;