const express = require('express');
const bodyParser = require('body-parser');
const { connect, 
  createTables, 
  clearTables, 
  seedData , 
  getUserByEmailAndPassword, 
  createProduct,
  getProducts,
  getProductByID,
  addProductToCart,
  deleteProductById,
  updateProductById,
  getCartItemsByUserId,
  deleteCartItemById,
  updateCartItemById,
  createOrder,
  getOrdersByUserId,
  getOrderById,
  getProductByName,


} = require('./db');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { continueSession } = require('pg/lib/crypto/sasl');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const secretKey = '2308-ACC-PT-WEB-PT-A'; 
app.use(cors());

app.use(bodyParser.json());


connect()
    .then(() => createTables())
    .then(() => clearTables())
    .then(() => createTables())
    .then(() => seedData())

    
    
    const users = [];
    const products = [];
    const carts = [];
    const orders = [];
    
    
    app.use(bodyParser.json());
    
    
    function generateToken(user) {
      return jwt.sign({user}, secretKey, { expiresIn: '1h' }); 
    }
    
    function authenticateToken(req, res, next) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token == null) return res.sendStatus(401); 
      console.log(req.headers['authorization'])
      jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403); 
        req.user = user; 
        next();
      });
    }
    
   
    app.post('/api/auth/register', (req, res) => {
      const { username, email, password } = req.body;
      const user = { user_id: uuidv4(), username, email, password };
      users.push(user);
      res.status(201).json({ message: 'User registered successfully' });
    });
    
    app.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;
      console.log(email, password);
      getUserByEmailAndPassword(email, password).then(user => {
        console.log(user);
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });
        const token = generateToken(user);
        console.log(token);
        res.json({ token });
      });
    });
    
    
    app.get('/api/user/profile', authenticateToken, (req, res) => {
      return res.json(req.user);
    });
    
    app.put('/api/user/profile', authenticateToken, (req, res) => {
      const userId = req.params.id;
      
      if (userId !== req.user.user_id) return res.sendStatus(403);
      
    });
    
    app.delete('/api/user/profile', authenticateToken, (req, res) => {
      const userId = req.params.id;
      
      if (userId !== req.user.user_id) return res.sendStatus(403);
      
    });
    
    
    app.get('/api/products', (req, res) => {
      
      getProducts().then(products => {
        res.json(products);
      });
    });
    
    app.get('/api/products/:id', (req, res) => {
      
      const name = req.params.id;
      console.log(name);
      getProductByID(name).then(products => {
        console.log(products);
        res.json(products);
      });
    });
    
    app.get('/api/product/:name', (req, res) => {
      
      const name = req.params.name;
      console.log(name);
      getProductByName(name).then(products => {
        console.log(products);
        res.json(products);
      });
    });
    
    app.post('/api/products', authenticateToken, (req, res) => {
      
      const { name, description, price } = req.body;
      const product = { product_id: uuidv4(), name, description, price };
      createProduct(name, description, price).then(product => {
        res.status(201).json(product);
      });
    });
    
    app.put('/api/products/:id', authenticateToken, (req, res) => {
      \
      const productId = req.params.id;
      const { name, description, price } = req.body;
      updateProductById(productId, name, description, price).then(product => {
        res.json(product);
      });

    });
    
    app.delete('/api/products/:id', authenticateToken, (req, res) => {
     
      const productId = req.params.id;
      deleteProductById(productId).
      then(() => {
        res.json({ message: 'Product deleted successfully' });
      });
    });
    
    
    app.get('/api/user/cart', authenticateToken, (req, res) => {
      
      console.log('175',req.user);
      const userId = req.user.user.user_id;
      getCartItemsByUserId(userId).then(cartItems => {
        res.json(cartItems);
      });
    });
    
    app.post('/api/user/cart/:product_id', authenticateToken, (req, res) => {
      
      const userId = req.user.user.user_id;
      const productId = req.params.product_id;
      const { quantity } = req.body;
      addProductToCart(userId, productId,quantity);
      getCartItemsByUserId(userId).then(cartItems => {
        res.json(cartItems);
      });
    });
    
    app.put('/api/user/cart/:product_id', authenticateToken, (req, res) => {
      
      const productId = req.params.product_id;
      const { quantity } = req.body;
      updateCartItemById(productId, quantity).then(cartItem => {
        res.json(cartItem);
      });
    });
    
    app.delete('/api/user/cart/:product_id', authenticateToken, (req, res) => {
      
      const productId = req.params.product_id;
      deleteCartItemById(productId).then(() => {
        res.json({ message: 'Product removed from cart' });
      }
      );
    });

    
   
    app.post('/api/user/orders', authenticateToken, (req, res) => {
      
      const userId = req.user.user.user_id;
      const { total_amount } = req.body;
      createOrder(userId, total_amount).then(order => {
        res.status(201).json(order);
      });
    });
    
    app.get('/api/user/orders', authenticateToken, (req, res) => {
      
      const userId = req.user.user_id;
      getOrdersByUserId(userId).then(orders => {
        res.json(orders);
      });
    });
    
    app.get('/api/user/orders/:order_id', authenticateToken, (req, res) => {
      
      const orderId = req.params.order_id;
      getOrderById(orderId).then(order => {
        res.json(order);
      });
      
    });
    // Homepage
    app.get('/', (req, res) => {
      res.send('Welcome to the homepage!');
    });
    
    
    app.use((req, res) => {
      res.status(404).send('404 Not Found');
    });
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    