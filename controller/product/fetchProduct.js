const Product = require('../../models/product');
const Cart = require('../../models/cart'); 

exports.getHome = async (req, res, next) => {
  try {
    const category = req.query.category; 
    let products;

    // 1. Fetch products based on category
    if (!category || category === 'All') {
      products = await Product.find({});
    } else {
      products = await Product.find({ categories: category });
    }

    // 2. Cart count logic
    let cartCount = 0;
    if (req.session.user) {
      const cart = await Cart.findOne({ userId: req.session.user._id });
      if (cart) {
        cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      }
    }

    // 3. Handle empty products
    if (products.length === 0) {
      return res.render("home", { 
        products: [], 
        message: `No products found in category "${category}"`,
        user: req.session.user || null,
        cartCount
      });
    }

    // Example delivery estimate
    const deliveryEstimate = "Estimated delivery: " + 
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString();

    // 4. Render home with products + cartCount
    
    res.render("home", { 
      products, 
      message: null, 
      user: req.session.user || null,
      cartCount,
      deliveryEstimate
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};


// GET /products/search?q=laptop&category=Computers
exports.getSearchProducts = async (req, res) => {
    try {
      const query = req.query.q?.trim() || "";
      const category = req.query.category || "";
      console.log(category)
  
      let filter = {};
  
      // Search by title (case-insensitive)
      if (query) {
        filter.title = { $regex: query, $options: "i" };
      }
  
      // Filter by category (ignore if "All")
      if (category && category !== "All") {
        filter.categories = { $regex: category, $options: "i" };
        // or filter.category = category; if it's a single string
      }
  
      const products = await Product.find(filter);

      // ✅ calculate cartCount
        let cartCount = 0;
        if (req.session.user) {
        const cart = await Cart.findOne({ userId: req.session.user._id });
            if (cart) {
                cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            }
        }

         // Example delivery estimate
        const deliveryEstimate = "Estimated delivery: " + 
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString();

      res.render("home", { 
        products, 
        message: products.length === 0 ? `No products found for "${category}"` : null, 
        user: req.session.user || null ,
        cartCount,
        deliveryEstimate

      });
    } catch (err) {
      console.error("Search error:", err);
      res.status(500).send("Server error");
    }
  };

  

  



  // Add review
  exports.addReview = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).send("Product not found");
  
      product.reviews.push({
        user: req.user._id,
        stars: req.body.stars,
        comment: req.body.comment,
      });
  
      product.updateRating();
      await product.save();
  
      res.redirect("/product/" + req.params.id);
    } catch (err) {
      res.status(500).send(err.message);
    }
  };
  
  // Update review
  exports.updateReview = async (req, res) => {
    try {
      const { id, reviewId } = req.params;
      const product = await Product.findById(id);
      if (!product) return res.status(404).send("Product not found");
  
      const review = product.reviews.id(reviewId);
      if (!review) return res.status(404).send("Review not found");
  
      if (review.user.toString() !== req.user._id.toString()) {
        return res.status(403).send("Not authorized");
      }
  
      review.stars = req.body.stars ?? review.stars;
      review.comment = req.body.comment ?? review.comment;
  
      product.updateRating();
      await product.save();
  
      res.redirect("/product/" + id);
    } catch (err) {
      res.status(500).send(err.message);
    }
  };
  
  // Delete review
  exports.deleteReview = async (req, res) => {
    try {
      const { id, reviewId } = req.params;
      const product = await Product.findById(id);
      if (!product) return res.status(404).send("Product not found");
  
      const review = product.reviews.id(reviewId);
      if (!review) return res.status(404).send("Review not found");
  
      if (review.user.toString() !== req.user._id.toString()) {
        return res.status(403).send("Not authorized");
      }
  
      product.reviews.pull({ _id: reviewId });
      product.updateRating();
      await product.save();
  
      res.redirect("/product/" + id);
    } catch (err) {
      res.status(500).send(err.message);
    }
  };

  //product page details
  exports.getProduct = async (req, res, next) => {
    try {
      const category = req.query.category;
      // 2. Cart count logic
      let cartCount = 0;
      if (req.session.user) {
        const cart = await Cart.findOne({ userId: req.session.user._id });
        if (cart) {
          cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        }
      }

      const product = await Product.findById(req.params.id).populate({
        path: 'reviews',
        populate: { path: 'user', select: 'name' }  // this loads user.name
        });
      if (!product) return res.status(404).send("Product not found");
  
      // Example delivery estimate
      const deliveryEstimate = "Estimated delivery: " + 
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString();

        
  
      res.render("product", { 
        product, 
        deliveryEstimate, 
        message: null, 
        user: req.session.user || null,
        cartCount
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  };


 