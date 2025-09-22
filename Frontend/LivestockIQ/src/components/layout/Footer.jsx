const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 bg-white border-t">
      <div className="container mx-auto text-center text-gray-500">
        <p>&copy; {currentYear} LivestockIQ. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;