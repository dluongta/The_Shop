const discounts = [
  {
    code: 'DISCOUNT10',
    description: '10% off your next purchase',
    amount: 10,
    discountType: 'percent',
    isActive: true,
    userId: null,
    usedBy: [],
  },
  {
    code: 'DISCOUNT20',
    description: '20% off your next purchase',
    amount: 20,
    discountType: 'percent',
    isActive: true,
    userId: null,
    usedBy: [],
  },
  {
    code: 'SALE100',
    description: '$100 off your next purchase',
    amount: 100,
    discountType: 'fixed',
    isActive: true,
    userId: null,
    usedBy: [],
  },
];

export default discounts;
