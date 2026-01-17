import React from 'react'
import { Pagination } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

const Paginate = ({ pages, page, isAdmin = false, keyword = '' }) => {
  let items = [];
  const firstPage = 1;
  const lastPage = pages;
  const currentPage = page;

  // Handle First and Previous buttons
  items.push(
    <LinkContainer
      key="first"
      to={
        !isAdmin
          ? keyword
            ? `/search/${keyword}/page/${1}`
            : `/page/${1}`
          : `/admin/productlist/${1}`
      }
    >
      <Pagination.First key="first" disabled={currentPage === firstPage} />
    </LinkContainer>
  );
  items.push(
    <LinkContainer
      key="prev"
      to={
        !isAdmin
          ? keyword
            ? `/search/${keyword}/page/${currentPage - 1}`
            : `/page/${currentPage - 1}`
          : `/admin/productlist/${currentPage - 1}`
      }
    >
      <Pagination.Prev key="prev" disabled={currentPage === firstPage} />
    </LinkContainer>
  );

  // Handle numbered buttons and Ellipsis
  for (let number = firstPage; number <= lastPage; number++) {
    if (number === currentPage || number === firstPage || number === lastPage || (number >= currentPage - 2 && number <= currentPage + 2)) {
      items.push(
        <LinkContainer
          key={number}
          to={
            !isAdmin
              ? keyword
                ? `/search/${keyword}/page/${number}`
                : `/page/${number}`
              : `/admin/productlist/${number}`
          }
        >
          <Pagination.Item key={number} active={number === currentPage}>
            {number}
          </Pagination.Item>
        </LinkContainer>,
      );
    } else if (number === currentPage - 3 || number === currentPage + 3) {
      items.push(<Pagination.Ellipsis key={number} />);
    }
  }

  // Handle Next and Last buttons
  items.push(
    <LinkContainer
      key="next"
      to={
        !isAdmin
          ? keyword
            ? `/search/${keyword}/page/${currentPage + 1}`
            : `/page/${currentPage + 1}`
          : `/admin/productlist/${currentPage + 1}`
      }
    >
      <Pagination.Next key="next" disabled={currentPage === lastPage} />
    </LinkContainer>
  );
  items.push(
    <LinkContainer
      key="last"
      to={
        !isAdmin
          ? keyword
            ? `/search/${keyword}/page/${lastPage}`
            : `/page/${lastPage}`
          : `/admin/productlist/${lastPage}`
      }
    >
      <Pagination.Last key="last" disabled={currentPage === lastPage} />
    </LinkContainer>
  );
  return (
    pages > 1 && (
      <Pagination className="justify-content-center">
        {items}
      </Pagination>
    )
  )
}

export default Paginate
