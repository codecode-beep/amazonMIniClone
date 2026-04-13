const Product = require('../../models/product');
const Cart = require('../../models/cart');
const Order = require('../../models/order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCart = async (req, res) => {
    if (!req.session.user) return res.redirect("/signin");
  
    const userId = req.session.user._id;
    const cart = await Cart.findOne({ userId }).populate("items.productId");


    // Example delivery estimate
    const deliveryEstimate = "Estimated delivery: " + new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString();
    // 2. Cart count logic
    let cartCount = 0;
    if (req.session.user) {
      const cart = await Cart.findOne({ userId: req.session.user._id });
      if (cart) {
        cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      }
    }

  
    res.render("cart", {
      cartItems: cart ? cart.items : [],
      user: req.session.user,
      deliveryEstimate,
      cartCount
    });
  };

exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user._id; // assuming user logged in

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += 1;
    } else {
      cart.items.push({ productId, quantity: 1 });
    }

    await cart.save();

    const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({ success: true, message: "Product added to cart",cartCount});
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false,cartCount });
  }
};

// 2. Increase quantity
exports.increaseQuantity = async (req, res) => {
    try {
      const { productId } = req.body;
      const userId = req.session.user._id;
  
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      if (!cart) return res.json({ success: false, message: "Cart not found" });
  
      const item = cart.items.find(i => i.productId._id.toString() === productId);
      if (item) item.quantity += 1;
  
      await cart.save();
      const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      const cartTotal = cart.items.reduce((sum, i) => sum + (i.productId.price * i.quantity), 0);
  
      res.json({ success: true, cartCount,cartTotal, quantity: item.quantity });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  };
  
  // 3. Decrease quantity
  exports.decreaseQuantity = async (req, res) => {
    try {
      const { productId } = req.body;
      const userId = req.session.user._id;
  
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      if (!cart) return res.json({ success: false, message: "Cart not found" });
  
      const itemIndex = cart.items.findIndex(i => i.productId._id.toString() === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity -= 1;
  
        if (cart.items[itemIndex].quantity <= 0) {
          cart.items.splice(itemIndex, 1); // remove item
        }
      }
  
      await cart.save();
      const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      const cartTotal = cart.items.reduce((sum, i) => sum + (i.productId.price * i.quantity), 0);
  
      res.json({ success: true, cartCount,cartTotal });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  };
  
  // 4. Remove from cart
  exports.removeFromCart = async (req, res) => {
    try {
      const { productId } = req.body;
      console.log(productId);
      const userId = req.session.user._id;
  
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      
      if (!cart) return res.json({ success: false, message: "Cart not found" });
  
      cart.items = cart.items.filter(i => i.productId._id.toString() !== productId);
      await cart.save();
      const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      const cartTotal = cart.items.reduce((sum, i) => sum + (i.productId.price * i.quantity), 0);
      res.json({ success: true, cartCount,cartTotal });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  };

exports.getCheckout = async (req, res, next) => {
    
    if (!req.session.user) return res.redirect("/signin");

    const userId = req.session.user._id;
    let cart, deliveryEstimate;

    Cart.findOne({ userId })
    .populate("items.productId")
    .then((foundCart) => {
        cart = foundCart;
        deliveryEstimate =
        "Estimated delivery: " +
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString();

        return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: cart.items.map((p) => ({
            price_data: {
            currency: "usd",
            product_data: {
                name: p.productId.title,
                description: p.productId.description,
            },
            unit_amount: p.productId.price * 100,
            },
            quantity: p.quantity,
        })),
        mode: "payment",
        success_url: req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
        });
    })
    .then((session) => {
        res.render("checkout", {
        cartItems: cart ? cart.items : [],
        user: req.session.user,
        deliveryEstimate,
        sessionId: session.id,
        });
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({ success: false });
    });
};

exports.getCheckoutSuccess = async (req, res) => {
  try {
    const userId = req.session.user._id;

    // 1️⃣ Get cart items before clearing
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.redirect("/cart");
    }

    const deliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days later

    // 2️⃣ Save as new order
    await Order.create({
      userId,
      items: cart.items.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
        status:"Order Placed",
      })),
      totalAmount: cart.items.reduce(
        (sum, item) => sum + item.quantity * item.productId.price,
        0
      ),
      paymentStatus: "Paid",
      createdAt: new Date(),
      deliveryDate,
    });

    // 3️⃣ Clear the cart
    await Cart.deleteOne({ userId });

    // 4️⃣ Redirect to order page
    res.redirect("/orders");
  } catch (err) {
    console.error("Error after payment success:", err);
    res.status(500).send("Error processing order after payment.");
  }
};

exports.getOrder = async (req, res, next) => {
      const userId = req.session.user._id;
      const orders = await Order.find({ userId })
        .populate("userId")                // ✅ get full user info
        .populate("items.productId")       // ✅ get full product info
        .sort({ createdAt: -1 });          // latest first
        const ordersWithCancelFlag = orders.map(order => ({
          ...order.toObject(),
          allCanceled: order.items.every(item => item.status === "Cancelled")
        }));

        let cartCount = 0;
        if (req.session.user) {
          const cart = await Cart.findOne({ userId: req.session.user._id });
          if (cart) {
            cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          }
        }
  
      res.render("orders", { 
        orders: ordersWithCancelFlag,
        user: req.session.user,
        cartCount
      });
  
}

exports.getOrderCancelItem= async (req, res, next) => {
  const { itemId } = req.params;
  const orderItem = await Order.findOne({ "items._id": itemId })
    .populate("items.productId");
  
  const item = orderItem.items.find(i => i._id.toString() === itemId);
  res.render("cancelOrder", { item });
}

exports.postOrderCancel= async(req,res,next)=>{
    const { itemId } = req.params;
    const { reason } = req.body;

    console.log(itemId);
    console.log(reason);

  
    // Update order or mark item as cancelled
    await Order.updateOne(
      { "items._id": itemId },
      { $set: { "items.$.status": "Cancelled", "items.$.cancelReason": reason } }
    );
  
    res.redirect("/orders"); // Redirect back to orders page
  
}

