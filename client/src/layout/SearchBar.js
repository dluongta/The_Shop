import { Form, FormControl, Container, Button } from 'react-bootstrap'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SearchBar = () => {
  const [keyword, setKeyword] = useState('')
  const navigate = useNavigate()  // Using useNavigate for navigation

  const submitHandler = (e) => {
    e.preventDefault()
    if (keyword.trim()) {
      navigate(`/search/${keyword}`)  // Use navigate for routing in React Router v6
    } else {
      navigate('/')  // Redirect to home page if no keyword
    }
  }

  return (
    <Container className='mb-5 mt-5'>
      <Form onSubmit={submitHandler} className='d-flex'>
        <FormControl
          type='text'
          name='q'
          onChange={(e) => setKeyword(e.target.value)}
          placeholder='Search Products...'
          className='me-2'
        ></FormControl>
        <Button type='submit' variant='outline-success' className='p-2'>
          Search
        </Button>
      </Form>
    </Container>
  )
}

export default SearchBar
