const express = require('express');
const cors = require('cors');
const path = require('node:path');
const categoryRoutes = require('../backend/modules/category/categoryRoutes.js');
const authRoutes = require('../backend/modules/auth/authRoutes.js');
const productRoutes = require("../backend/modules/product/productRoutes.js");
const productImageRoutes = require("../backend/modules/productImages/productImagesRoutes.js");
const cartRoutes = require("../backend/modules/cart/cartRoutes.js");
const customerRoutes = require("../backend/modules/customer/customerRoutes.js");
const customerAddressRoutes = require("../backend/modules/customerAddress/customerAddressRoutes.js");
const customerOrderRoutes = require("../backend/modules/customerOrder/customerOrderRoutes.js");
const paymentRoutes = require("../backend/modules/payment/paymentRoutes.js");
const inventoryRoutes = require("./modules/inventory/inventoryRoutes.js");
const customerPaymentRoutes = require("./modules/customerPayment/customerPaymentRoutes.js");
const reviewRoutes = require("../backend/modules/reviews/reviewsRoutes.js");
const productVariantRoutes = require("./modules/productVariant/productVariantRoutes.js");
const notificationRoutes = require("./modules/notifications/notificationsRoutes.js");
const productVideoRoutes = require("./modules/productVideos/productVideosRoutes.js");
const websiteSettingsRoutes = require("./modules/websiteSettings/websiteSettingsRoutes.js");
const returnRequestRoutes = require("./modules/returnRequests/returnRequestsRoutes.js");
const homepageBannerRoutes = require("./modules/homepageBanners/homepageBannersRoutes.js");
const salesReportRoutes = require("./modules/salesReports/salesReportsRoutes.js");
const couponRoutes = require("./modules/coupons/couponsRoutes.js");


const app = express();

app.use(cors({
    origin: 'http://localhost:5173'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Jaysha Carpet API'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Jaysha Carpet Backend is running'
    });
});

app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-images", productImageRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customer-addresses", customerAddressRoutes);
app.use("/api/orders", customerOrderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/customer-payments", customerPaymentRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/product-variants", productVariantRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/product-videos", productVideoRoutes);
app.use("/api/website-settings", websiteSettingsRoutes);
app.use("/api/return-requests", returnRequestRoutes);
app.use("/api/homepage-banners", homepageBannerRoutes);
app.use("/api/sales-reports", salesReportRoutes);
app.use("/api/coupons", couponRoutes);


module.exports = app;