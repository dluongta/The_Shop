import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Button } from 'react-bootstrap';
import Message from '../components/Message';  // Assuming you have this Message component
import { getDiscounts } from '../actions/discountActions';

const DiscountListScreen = () => {
  const dispatch = useDispatch();

  // Fetch the discount list from the Redux store
  const discountList = useSelector((state) => state.discountList || {});
  console.log(discountList);
  const { discounts = [], loading, error } = discountList;

  useEffect(() => {
    dispatch(getDiscounts());  // Dispatch action to fetch discounts
  }, [dispatch]);

  // Function to handle copying discount code to clipboard
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

  return (
    <div>
      <h1>Available Discount Codes</h1>

      {loading && <Message variant="info">Loading...</Message>}  {/* Show loading message */}
      {error && <Message variant="danger">{error}</Message>}    {/* Show error message */}

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
                    Discount: {discount.amount}%
                  </Card.Text>
                  <Button
                    variant="primary"
                    onClick={() => handleCopyCode(discount.code)}  // Trigger copy code function
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
