const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer py-4 footer-custom text-dark mt-5">
      <div className="container text-center">
        <h5>
          <a
            href="https://github.com/dluongta"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-brand"
          >
            <i className="fa fa-user"></i>
            <span>DLUONGTA</span>
          </a>
        </h5>

        <p>Web Developer | Email: dluongta@gmail.com</p>

        <p>&copy; {year} DLUONGTA. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;