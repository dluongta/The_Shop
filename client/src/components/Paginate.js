import React from 'react'
import { Pagination } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'

const Paginate = ({ pages, page }) => {
  const location = useLocation()
  const navigate = useNavigate()

  // Hàm xử lý chuyển trang
  const handleNavigate = (num) => {
    const searchParams = new URLSearchParams(location.search)
    searchParams.set('pageNumber', num)
    
    navigate({
      pathname: location.pathname,
      search: `?${searchParams.toString()}`,
    })
  }

  if (pages <= 1) return null

  let items = []
  const firstPage = 1
  const lastPage = pages
  const currentPage = page

  // Nút Đầu & Trang Trước
  items.push(
    <Pagination.First 
      key="first" 
      disabled={currentPage === firstPage} 
      onClick={() => handleNavigate(firstPage)}
    />
  )
  items.push(
    <Pagination.Prev 
      key="prev" 
      disabled={currentPage === firstPage} 
      onClick={() => handleNavigate(currentPage - 1)}
    />
  )

  // Danh sách số trang & Dấu ba chấm
  for (let number = firstPage; number <= lastPage; number++) {
    if (
      number === currentPage ||
      number === firstPage ||
      number === lastPage ||
      (number >= currentPage - 2 && number <= currentPage + 2)
    ) {
      items.push(
        <Pagination.Item 
          key={number} 
          active={number === currentPage}
          onClick={() => handleNavigate(number)}
        >
          {number}
        </Pagination.Item>
      )
    } else if (number === currentPage - 3 || number === currentPage + 3) {
      items.push(<Pagination.Ellipsis key={`ellipsis-${number}`} />)
    }
  }

  // Nút Trang Sau & Cuối
  items.push(
    <Pagination.Next 
      key="next" 
      disabled={currentPage === lastPage} 
      onClick={() => handleNavigate(currentPage + 1)}
    />
  )
  items.push(
    <Pagination.Last 
      key="last" 
      disabled={currentPage === lastPage} 
      onClick={() => handleNavigate(lastPage)}
    />
  )

  return (
    <Pagination className="justify-content-center my-4">
      {items}
    </Pagination>
  )
}

export default Paginate