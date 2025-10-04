const products = [
  {
    name: 'Airpods Wireless Bluetooth Headphones',
    images: ['/images/airpods.jpg','/images/keyboard.jpg'],
    description:
      'Bluetooth technology lets you connect it with compatible devices wirelessly High-quality AAC audio offers immersive listening experience Built-in microphone allows you to take calls while working',
    brand: 'Apple',
    category: 'Phone Accessories',
    price: 89.99,
    countInStock: 3,
    rating: 0,
    numReviews: 0,
  },
  {
    name: 'iPhone 11 Pro 256GB Memory',
    images: ['/images/phone.jpg','/images/keyboard.jpg'],
    description:
      'Introducing the iPhone 11 Pro. A transformative triple-camera system that adds tons of capability without complexity. An unprecedented leap in battery life',
    brand: 'Apple',
    category: 'Smartphone',
    price: 599.99,
    countInStock: 10,
    rating: 0,
    numReviews: 0,
  },
  {
    name: 'Cannon EOS 80D DSLR Camera',
    images: ['/images/camera.jpg','/images/keyboard.jpg'],
    description:
      'Characterized by versatile imaging specs, the Canon EOS 80D further clarifies itself using a pair of robust focusing systems and an intuitive design',
    brand: 'Cannon',
    category: 'Media',
    price: 929.99,
    countInStock: 0,
    rating: 0,
    numReviews: 0,
  },
  {
    name: 'Sony Playstation 4 Pro White Version',
    images: ['/images/playstation.jpg','/images/camera.jpg'],
    description:
      'The ultimate home entertainment center starts with PlayStation. Whether you are into gaming, HD movies, television, music',
    brand: 'Sony',
    category: 'Gaming',
    price: 399.99,
    countInStock: 10,
    rating: 0,
    numReviews: 0,
  },
  {
    name: 'Logitech G-Series Gaming Mouse',
    images: ['/images/mouse.jpg','/images/camera.jpg'],
    description:
      'Get a better handle on your games with this Logitech LIGHTSYNC gaming mouse. The six programmable buttons allow customization for a smooth playing experience',
    brand: 'Logitech',
    category: 'Electronics',
    price: 49.99,
    countInStock: 7,
    rating: 0,
    numReviews: 0,
  },
  {
    name: 'Amazon Echo Dot 3rd Generation',
    images: ['/images/alexa.jpg','/images/camera.jpg'],
    description:
      'Meet Echo Dot - Our most popular smart speaker with a fabric design. It is our most compact smart speaker that fits perfectly into small space',
    brand: 'Amazon',
    category: 'Electronics',
    price: 29.99,
    countInStock: 0,
    rating: 0,
    numReviews: 0,
    
  },
  {
    name: 'DELL XPS',
    images: ['/images/laptop.png','/images/camera.jpg'],
    description:
      'High quality with impressive display and sound',
    brand: 'DELL',
    category: 'Electronics',
    price: 599.99,
    countInStock: 10,
    rating: 5,
    numReviews: 1,
    reviews: [{
      _id: '65f30ca6103e860041ed185d',
      name:"Jane",
      rating:5,
      comment:"Good",
      user: '65f2da2354a4dd16902dd94e',
      createdAt:'2024-03-14T14:41:42.442+00:00',
      updatedAt:'2024-03-14T14:41:42.442+00:00',
    },]
  },
  {
    name: 'Iphone',
    images: ['/images/iphone.jpg','/images/camera.jpg'],
    description:
      'High Quality Iphone',
    brand: 'Apple',
    category: 'Electronics',
    price: 99.99,
    countInStock: 10,
    rating: 5,
    numReviews: 1,
    reviews: [{
      _id: '65f30ca6103e860041ed185d',
      name:"Jane",
      rating:5,
      comment:"Good",
      user: '65f2da2354a4dd16902dd94e',
      createdAt:'2024-03-14T14:41:42.442+00:00',
      updatedAt:'2024-03-14T14:41:42.442+00:00',
    },]
  },
  {
    name: 'Computer Keyboard',
    images: ['/images/keyboard.jpg','/images/camera.jpg'],
    description:
      'Compatible with most of computer devices',
    brand: 'DELL',
    category: 'Electronics',
    price: 29.99,
    countInStock: 10,
    rating: 5,
    numReviews: 1,
    reviews: [{
      _id: '65f30ca6103e860041ed185d',
      name:"Jane",
      rating:5,
      comment:"Good",
      user: '65f2da2354a4dd16902dd94e',
      createdAt:'2024-03-14T14:41:42.442+00:00',
      updatedAt:'2024-03-14T14:41:42.442+00:00',
    },]
  },

]

// Add 300 more products to the array
/*for (let i = 1; i <= 300; i++) {
  const newProduct = {
    name: `Sample Product ${i}`,
    images: ['/images/sample.jpg'],
    description: `This is a description for Sample Product ${i}`,
    brand: 'Sample Brand',
    category: 'Sample Category',
    price: (i * 10).toFixed(2),
    countInStock: i % 5,
    rating: 0,
    numReviews: 0,
    createdAt:'2024-03-14T14:41:42.442+00:00',
    updatedAt:'2024-03-14T14:41:42.442+00:00',
  };
  products.push(newProduct);
}
*/
export default products
