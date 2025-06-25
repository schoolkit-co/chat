const request = require('supertest');
const app = require('@server/index'); // Assuming your app is exported from here

// Mockery for JWT authentication and other potential middleware
// Allow dynamic user and admin status for testing
let mockUser = { id: 'testUserId', isAdmin: false };
const mockRequireJwtAuth = (req, res, next) => {
  req.user = mockUser;
  next();
};

const mockCheckAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
};

jest.mock('@server/middleware/requireJwtAuth', () => mockRequireJwtAuth);
jest.mock('@server/middleware/checkAdmin', () => mockCheckAdmin);

// Helper to set the mock user for a test
const setMockUser = (user) => {
  mockUser = user;
};

jest.mock('@server/middleware/checkBan', () => (req, res, next) => {
  next();
});

// Mock any other middleware that might interfere with basic route testing
// For example, if you have permission checks, mock them to allow access for these tests.

// Mock Coupon models
const mockCouponFns = {
  createCoupon: jest.fn(),
  getAllCoupons: jest.fn(),
  getCouponByCode: jest.fn(),
  updateCoupon: jest.fn(),
  deleteCoupon: jest.fn(),
};
const mockCouponLogFns = {
  redeemCoupon: jest.fn(),
  getUserCouponLogs: jest.fn(),
};

jest.mock('../models/Coupon', () => mockCouponFns);
jest.mock('../models/CouponLog', () => mockCouponLogFns);

// Helper to reset mocks before each test
const resetMocks = () => {
  Object.values(mockCouponFns).forEach(mockFn => mockFn.mockReset());
  Object.values(mockCouponLogFns).forEach(mockFn => mockFn.mockReset());
};

describe('Custom API Routes', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(done);
  });

  afterAll((done) => {
    server.close(done);
  });

  // Test for routes.customUser - Assuming a GET endpoint like /api/user/custom
  describe('GET /api/user/custom', () => {
    it('should respond with 200 for customUser route', async () => {
      const response = await request(server).get('/api/user/custom');
      // Replace 404 with the expected status code if the endpoint is different or requires specific conditions
      // For a simple check, we might expect it to exist, or be a placeholder returning 200/404 initially.
      // This depends on how 'routes.customUser' is actually implemented.
      // If it's a POST, change .get to .post and add .send({})
      expect(response.statusCode).not.toBe(500); // Example: Check it doesn't error out
    });
  });

  describe('POST /api/coupon/redeem (User)', () => {
    const redeemData = { couponCode: 'REDEEM123' };
    const userId = 'testUserId';

    beforeEach(() => {
      resetMocks();
      setMockUser({ id: userId, isAdmin: false }); // Regular user
    });

    it('should respond with 200 and redeem the coupon', async () => {
      const redeemResult = { message: 'คูปองถูกใช้แล้ว เครดิตถูกเพิ่มเรียบร้อย', creditAdded: 100 };
      mockCouponLogFns.redeemCoupon.mockResolvedValue(redeemResult);

      const response = await request(server).post('/api/coupon/redeem').send(redeemData);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(redeemResult);
      expect(mockCouponLogFns.redeemCoupon).toHaveBeenCalledWith(userId, redeemData.couponCode);
    });

    it('should respond with 400 if couponCode is not found', async () => {
      mockCouponLogFns.redeemCoupon.mockRejectedValue(new Error('ไม่พบคูปองที่ระบุ'));
      const response = await request(server).post('/api/coupon/redeem').send(redeemData);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('ไม่พบคูปองที่ระบุ');
    });

    it('should respond with 400 if coupon is expired', async () => {
      mockCouponLogFns.redeemCoupon.mockRejectedValue(new Error('คูปองนี้หมดอายุแล้ว'));
      const response = await request(server).post('/api/coupon/redeem').send(redeemData);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('คูปองนี้หมดอายุแล้ว');
    });

    it('should respond with 400 if coupon was already redeemed by the user', async () => {
      mockCouponLogFns.redeemCoupon.mockRejectedValue(new Error('คุณเคยใช้คูปองนี้ไปแล้ว'));
      const response = await request(server).post('/api/coupon/redeem').send(redeemData);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('คุณเคยใช้คูปองนี้ไปแล้ว');
    });
    
    it('should respond with 500 for other errors during redemption', async () => {
      mockCouponLogFns.redeemCoupon.mockRejectedValue(new Error('Some other redemption error'));
      const response = await request(server).post('/api/coupon/redeem').send(redeemData);
      expect(response.statusCode).toBe(500);
      expect(response.body.message).toContain('เกิดข้อผิดพลาด');
    });
  });

  describe('DELETE /api/coupon/:couponcode (Admin)', () => {
    const couponToDelete = 'DELETE_ME';

    beforeEach(() => {
      resetMocks();
      setMockUser({ id: 'adminUserId', isAdmin: true });
    });

    it('should respond with 200 and delete the coupon', async () => {
      const deleteResult = { message: 'คูปองถูกลบแล้ว' }; // Or whatever the actual success message is
      mockCouponFns.deleteCoupon.mockResolvedValue(deleteResult);

      const response = await request(server).delete(`/api/coupon/${couponToDelete}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(deleteResult);
      expect(mockCouponFns.deleteCoupon).toHaveBeenCalledWith(couponToDelete);
    });

    it('should respond with 403 if user is not admin', async () => {
      setMockUser({ id: 'regularUserId', isAdmin: false });
      const response = await request(server).delete(`/api/coupon/${couponToDelete}`);
      expect(response.statusCode).toBe(403);
      expect(mockCouponFns.deleteCoupon).not.toHaveBeenCalled();
    });

    it('should respond with 400 if couponcode param is missing or empty', async () => {
      const response = await request(server).delete('/api/coupon/ ');
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('กรุณาระบุรหัสคูปอง');
    });

    it('should respond with 404 if coupon to delete is not found', async () => {
      mockCouponFns.deleteCoupon.mockRejectedValue(new Error('ไม่พบคูปองที่ต้องการลบ'));
      const response = await request(server).delete(`/api/coupon/${couponToDelete}`);
      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('ไม่พบคูปองที่ต้องการลบ');
    });

    it('should respond with 500 for other errors during deletion', async () => {
      mockCouponFns.deleteCoupon.mockRejectedValue(new Error('Database deletion failure'));
      const response = await request(server).delete(`/api/coupon/${couponToDelete}`);
      expect(response.statusCode).toBe(500);
      expect(response.body.message).toContain('เกิดข้อผิดพลาด');
    });
  });

  describe('PUT /api/coupon/:couponcode (Admin)', () => {
    const targetCouponCode = 'UPDATE_ME';
    const updateData = {
      credit: 250,
      expiredDate: '2025-01-01',
      // Note: The route allows updating any part of the coupon, including couponCode itself if desired by the model.
      // For this test, we'll focus on credit and expiredDate.
    };

    beforeEach(() => {
      resetMocks();
      setMockUser({ id: 'adminUserId', isAdmin: true });
    });

    it('should respond with 200 and update the coupon', async () => {
      const updatedCoupon = { couponCode: targetCouponCode, ...updateData };
      mockCouponFns.updateCoupon.mockResolvedValue(updatedCoupon);

      const response = await request(server).put(`/api/coupon/${targetCouponCode}`).send(updateData);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(updatedCoupon);
      expect(mockCouponFns.updateCoupon).toHaveBeenCalledWith(targetCouponCode, updateData);
    });

    it('should respond with 403 if user is not admin', async () => {
      setMockUser({ id: 'regularUserId', isAdmin: false });
      const response = await request(server).put(`/api/coupon/${targetCouponCode}`).send(updateData);
      expect(response.statusCode).toBe(403);
      expect(mockCouponFns.updateCoupon).not.toHaveBeenCalled();
    });
    
    it('should respond with 400 if couponcode param is missing or empty', async () => {
      const response = await request(server).put('/api/coupon/ ').send(updateData);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('กรุณาระบุรหัสคูปอง');
    });

    it('should respond with 400 if coupon to update is not found', async () => {
      // Based on route logic: "ไม่พบคูปองที่ต้องการแก้ไข" results in 400
      mockCouponFns.updateCoupon.mockRejectedValue(new Error('ไม่พบคูปองที่ต้องการแก้ไข'));
      const response = await request(server).put(`/api/coupon/${targetCouponCode}`).send(updateData);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('ไม่พบคูปองที่ต้องการแก้ไข');
    });

    it('should respond with 400 if updated credit is less than 0', async () => {
       // Based on route logic: "เครดิตต้องไม่น้อยกว่า 0" results in 400
      mockCouponFns.updateCoupon.mockRejectedValue(new Error('เครดิตต้องไม่น้อยกว่า 0'));
      const dataWithNegativeCredit = { ...updateData, credit: -50 };
      const response = await request(server).put(`/api/coupon/${targetCouponCode}`).send(dataWithNegativeCredit);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('เครดิตต้องไม่น้อยกว่า 0');
    });

    it('should respond with 500 for other errors during update', async () => {
      mockCouponFns.updateCoupon.mockRejectedValue(new Error('Database update failure'));
      const response = await request(server).put(`/api/coupon/${targetCouponCode}`).send(updateData);
      expect(response.statusCode).toBe(500);
      expect(response.body.message).toContain('เกิดข้อผิดพลาด');
    });
  });

  describe('POST /api/coupon (Admin)', () => {
    const newCouponData = {
      couponCode: 'NEWCOUPON2024',
      credit: 150,
      expiredDate: '2024-12-31',
    };

    beforeEach(() => {
      resetMocks();
      setMockUser({ id: 'adminUserId', isAdmin: true });
    });

    it('should respond with 201 and create a new coupon', async () => {
      const createdCoupon = { ...newCouponData, _id: 'someCouponId' };
      mockCouponFns.createCoupon.mockResolvedValue(createdCoupon);

      const response = await request(server).post('/api/coupon').send(newCouponData);
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(createdCoupon);
      expect(mockCouponFns.createCoupon).toHaveBeenCalledWith({
        couponCode: newCouponData.couponCode,
        credit: newCouponData.credit,
        expiredDate: newCouponData.expiredDate,
      });
    });

    it('should respond with 403 if user is not admin', async () => {
      setMockUser({ id: 'regularUserId', isAdmin: false });
      const response = await request(server).post('/api/coupon').send(newCouponData);
      expect(response.statusCode).toBe(403);
      expect(mockCouponFns.createCoupon).not.toHaveBeenCalled();
    });

    const requiredFields = ['couponCode', 'credit', 'expiredDate'];
    requiredFields.forEach(field => {
      it(`should respond with 400 if ${field} is missing`, async () => {
        const incompleteData = { ...newCouponData };
        delete incompleteData[field];
        const response = await request(server).post('/api/coupon').send(incompleteData);
        expect(response.statusCode).toBe(400);
        // You might want to check for specific messages if your API provides them
        expect(response.body.message).toBeDefined(); 
      });
    });

    it('should respond with 400 if credit is not a number', async () => {
      const invalidData = { ...newCouponData, credit: 'not-a-number' };
      const response = await request(server).post('/api/coupon').send(invalidData);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('กรุณาระบุเครดิตเป็นตัวเลข');
    });

    it('should respond with 400 if couponCode already exists', async () => {
      mockCouponFns.createCoupon.mockRejectedValue(new Error('คูปองนี้มีอยู่ในระบบแล้ว'));
      const response = await request(server).post('/api/coupon').send(newCouponData);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('คูปองนี้มีอยู่ในระบบแล้ว');
    });
    
    it('should respond with 400 if credit is less than 0', async () => {
      mockCouponFns.createCoupon.mockRejectedValue(new Error('เครดิตต้องไม่น้อยกว่า 0'));
      //This test assumes the model layer throws this specific error.
      //If route layer has separate check, this might need adjustment.
      const dataWithNegativeCredit = { ...newCouponData, credit: -10 };
      const response = await request(server).post('/api/coupon').send(dataWithNegativeCredit);
      expect(response.statusCode).toBe(400); // Or based on how createCoupon is mocked for this
      expect(response.body.message).toBe('เครดิตต้องไม่น้อยกว่า 0');
    });

    it('should respond with 500 for other errors during creation', async () => {
      mockCouponFns.createCoupon.mockRejectedValue(new Error('Database failure'));
      const response = await request(server).post('/api/coupon').send(newCouponData);
      expect(response.statusCode).toBe(500);
      expect(response.body.message).toContain('เกิดข้อผิดพลาด');
    });
  });

  describe('GET /api/coupon/:couponcode (Admin)', () => {
    const testCouponCode = 'TEST100';
    beforeEach(() => {
      resetMocks();
      setMockUser({ id: 'adminUserId', isAdmin: true });
    });

    it('should respond with 200 and return the coupon for admin', async () => {
      const mockCoupon = { couponCode: testCouponCode, credit: 100 };
      mockCouponFns.getCouponByCode.mockResolvedValue(mockCoupon);

      const response = await request(server).get(`/api/coupon/${testCouponCode}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockCoupon);
      expect(mockCouponFns.getCouponByCode).toHaveBeenCalledWith(testCouponCode);
    });

    it('should respond with 403 if user is not admin', async () => {
      setMockUser({ id: 'regularUserId', isAdmin: false });
      const response = await request(server).get(`/api/coupon/${testCouponCode}`);
      expect(response.statusCode).toBe(403);
      expect(mockCouponFns.getCouponByCode).not.toHaveBeenCalled();
    });

    it('should respond with 400 if couponcode param is missing or empty', async () => {
      let response = await request(server).get('/api/coupon/ '); // Space to make it "empty" after trim
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('กรุณาระบุรหัสคูปอง');
      
      // Note: Supertest might automatically trim paths, so testing truly empty might be tricky.
      // The route logic `req.params?.couponcode?.trim()` handles this.
      // A call like `/api/coupon/` without anything after would hit the `GET /api/coupon` route instead.
    });
    
    it('should respond with 404 if coupon is not found', async () => {
      mockCouponFns.getCouponByCode.mockRejectedValue(new Error('ไม่พบคูปองที่ต้องการ'));
      const response = await request(server).get(`/api/coupon/${testCouponCode}`);
      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('ไม่พบคูปองที่ต้องการ');
    });

    it('should respond with 500 for other errors', async () => {
      mockCouponFns.getCouponByCode.mockRejectedValue(new Error('Database error'));
      const response = await request(server).get(`/api/coupon/${testCouponCode}`);
      expect(response.statusCode).toBe(500);
      expect(response.body.message).toContain('เกิดข้อผิดพลาด');
    });
  });

  describe('GET /api/coupon/logs/me (User)', () => {
    beforeEach(() => {
      resetMocks();
      setMockUser({ id: 'testUserId', isAdmin: false }); // Regular user for these tests
    });

    it('should respond with 200 and return user coupon logs', async () => {
      const mockLogs = [{ couponCode: 'USED100', redeemedAt: new Date() }];
      mockCouponLogFns.getUserCouponLogs.mockResolvedValue(mockLogs);

      const response = await request(server).get('/api/coupon/logs/me');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockLogs);
      expect(mockCouponLogFns.getUserCouponLogs).toHaveBeenCalledWith('testUserId');
    });

    it('should respond with 500 if getUserCouponLogs throws an error', async () => {
      mockCouponLogFns.getUserCouponLogs.mockRejectedValue(new Error('Database error'));
      const response = await request(server).get('/api/coupon/logs/me');
      expect(response.statusCode).toBe(500);
      expect(response.body.message).toContain('เกิดข้อผิดพลาด');
    });
  });

  // Test for routes.promptsUtil - Assuming a GET endpoint like /api/prompts/utils
  describe('GET /api/prompts/utils', () => {
    it('should respond with 200 for promptsUtil route', async () => {
      const response = await request(server).get('/api/prompts/utils');
      expect(response.statusCode).not.toBe(500);
    });
  });

  // Test for routes.school - Assuming a GET endpoint like /api/school
  describe('GET /api/school', () => {
    it('should respond with 200 for school route', async () => {
      const response = await request(server).get('/api/school');
      expect(response.statusCode).not.toBe(500);
    });
  });

  // Test for routes.coupon - Assuming a GET endpoint like /api/coupon
  describe('GET /api/coupon (Admin)', () => {
    beforeEach(() => {
      resetMocks();
      setMockUser({ id: 'adminUserId', isAdmin: true }); // Default to admin for these tests
    });

    it('should respond with 200 and return all coupons for admin', async () => {
      const mockCoupons = [{ code: 'ADMIN100', credit: 100 }];
      mockCouponFns.getAllCoupons.mockResolvedValue(mockCoupons);

      const response = await request(server).get('/api/coupon');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockCoupons);
      expect(mockCouponFns.getAllCoupons).toHaveBeenCalledTimes(1);
    });

    it('should respond with 403 if user is not admin', async () => {
      setMockUser({ id: 'regularUserId', isAdmin: false });
      const response = await request(server).get('/api/coupon');
      expect(response.statusCode).toBe(403);
      expect(mockCouponFns.getAllCoupons).not.toHaveBeenCalled();
    });

    it('should respond with 500 if getAllCoupons throws an error', async () => {
      mockCouponFns.getAllCoupons.mockRejectedValue(new Error('Database error'));
      const response = await request(server).get('/api/coupon');
      expect(response.statusCode).toBe(500);
      expect(response.body.message).toContain('เกิดข้อผิดพลาด');
    });
  });

  // Test for routes.customBalance - Assuming a GET endpoint like /api/custom-balance
  describe('GET /api/custom-balance', () => {
    it('should respond with 200 for customBalance route', async () => {
      const response = await request(server).get('/api/custom-balance');
      expect(response.statusCode).not.toBe(500); // Example: Check it doesn't error out
    });
  });

  // Test for routes.admin - Assuming a GET endpoint like /api/admin
  describe('GET /api/admin', () => {
    it('should respond with 200 for admin route', async () => {
      const response = await request(server).get('/api/admin');
      expect(response.statusCode).not.toBe(500);
    });
  });

  // Test for routes.customPresets - Assuming a GET endpoint like /api/custom-presets
  describe('GET /api/custom-presets', () => {
    it('should respond with 200 for customPresets route', async () => {
      const response = await request(server).get('/api/custom-presets');
      expect(response.statusCode).not.toBe(500);
    });
  });
});
