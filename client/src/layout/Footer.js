/* eslint-disable jsx-a11y/anchor-is-valid */

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <div className="container">
      <footer className="py-4 my-4 border-top">
        <div className="d-flex justify-content-center flex-wrap">
          {/* Column 1 */}
          <div style={{ marginRight: '5rem', marginLeft: '5rem' }} className="mb-3">
            <h5 className="text-center mb-2">Information</h5>
            <ul className="nav flex-column text-center">
              <li className="nav-item mb-2">
                <a href="#" className="nav-link p-0 text-muted">Home</a>
              </li>
              <li className="nav-item mb-2">
                <a href="#" className="nav-link p-0 text-muted">About Us</a>
              </li>
              <li className="nav-item mb-2">
                <a href="#" className="nav-link p-0 text-muted">Terms & Conditions</a>
              </li>
            </ul>
          </div>

          {/* Column 2 */}
          <div style={{ marginRight: '5rem', marginLeft: '5rem' }} className="mb-3">
            <h5 className="text-center mb-2">Support</h5>
            <ul className="nav flex-column text-center">
              <li className="nav-item mb-2">
                <a href="#" className="nav-link p-0 text-muted">Help Center</a>
              </li>
              <li className="nav-item mb-2">
                <a href="#" className="nav-link p-0 text-muted">Contact Us</a>
              </li>
              <li className="nav-item mb-2">
                <a href="#" className="nav-link p-0 text-muted">Privacy Policy</a>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-center text-muted mt-4">© {year} THE SHOP</p>
      </footer>
    </div>
  );
};

export default Footer;
