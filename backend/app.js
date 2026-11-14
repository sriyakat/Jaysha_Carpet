const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');

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
const contentImageRoutes = require("./modules/contentImages/contentImagesRoutes.js");
const homepageShowcaseRoutes = require("./modules/homepageShowcase/homepageShowcaseRoutes.js");
const homepageInspirationRoutes = require("./modules/homepageShowcase/homepageInspirationRoutes.js");
const homepageOfferRoutes = require("./modules/homepageShowcase/homepageOfferRoutes.js");
const homepageNewArrivalsRoutes = require("./modules/homepageNewArrivals/homepageNewArrivalsRoutes.js");
const customOrderRoutes = require("./modules/customOrders/customOrdersRoutes.js");
const blogPostRoutes = require("./modules/blogPosts/blogPostsRoutes.js");
const seoController = require("./modules/seo/seoController.js");
const { publicCache } = require("./utils/publicCache.js");



const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Jaysha Carpet Backend is running'
    });
});

app.get('/robots.txt', publicCache(300), seoController.getRobots);
app.get('/sitemap.xml', publicCache(300), seoController.getSitemap);


app.use('/api/categories', publicCache(60), categoryRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/products", publicCache(30), productRoutes);
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
app.use("/api/website-settings", publicCache(60), websiteSettingsRoutes);
app.use("/api/return-requests", returnRequestRoutes);
app.use("/api/homepage-banners", homepageBannerRoutes);
app.use("/api/sales-reports", salesReportRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/content-images", contentImageRoutes);
app.use("/api/homepage-showcase", homepageShowcaseRoutes);
app.use("/api/homepage-inspiration", homepageInspirationRoutes);
app.use("/api/homepage-offer", homepageOfferRoutes);
app.use("/api/homepage-new-arrivals", homepageNewArrivalsRoutes);
app.use("/api/custom-orders", customOrderRoutes);
app.use("/api/blog-posts", blogPostRoutes);


const frontendDistPath = path.join(__dirname, '..', 'frontend', 'frontend', 'dist');
const frontendIndexHtml = fs.readFileSync(path.join(frontendDistPath, 'index.html'), 'utf8');

app.get('/', (req, res) => {
    res.type('html').send(frontendIndexHtml);
});


app.get([
    '/shop',
    '/cart',
    '/checkout',
    '/customer/login',
    '/customer/register',
    '/customer/forgot-password',
    '/account',
    '/products',
    '/admin/products',
    '/setup-admin'
], (req, res) => {
    res.type('html').send(frontendIndexHtml);
});


app.use(express.static(frontendDistPath));
app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        return next();
    }
    res.type('html').send(frontendIndexHtml);
});


module.exports = app;