// MongoDB initialization script with sample data

// Create test database and collections
use('testdb');

// Create users collection
db.users.insertMany([
  {
    _id: ObjectId(),
    email: "john.doe@email.com",
    firstName: "John",
    lastName: "Doe",
    age: 28,
    city: "New York",
    isActive: true,
    createdAt: new Date(),
    profile: {
      bio: "Software developer with 5 years experience",
      skills: ["JavaScript", "Python", "MongoDB"],
      socialMedia: {
        twitter: "@johndoe",
        linkedin: "john-doe-dev"
      }
    },
    preferences: {
      notifications: true,
      theme: "dark",
      language: "en"
    }
  },
  {
    _id: ObjectId(),
    email: "jane.smith@email.com",
    firstName: "Jane",
    lastName: "Smith",
    age: 32,
    city: "Los Angeles",
    isActive: true,
    createdAt: new Date(),
    profile: {
      bio: "Product manager and UX enthusiast",
      skills: ["Product Management", "UX Design", "Analytics"],
      socialMedia: {
        twitter: "@janesmith",
        linkedin: "jane-smith-pm"
      }
    },
    preferences: {
      notifications: false,
      theme: "light",
      language: "en"
    }
  },
  {
    _id: ObjectId(),
    email: "mike.johnson@email.com",
    firstName: "Mike",
    lastName: "Johnson",
    age: 25,
    city: "Chicago",
    isActive: true,
    createdAt: new Date(),
    profile: {
      bio: "Full-stack developer and tech blogger",
      skills: ["React", "Node.js", "Docker", "AWS"],
      socialMedia: {
        twitter: "@mikej",
        github: "mike-johnson"
      }
    },
    preferences: {
      notifications: true,
      theme: "dark",
      language: "en"
    }
  },
  {
    _id: ObjectId(),
    email: "sarah.wilson@email.com",
    firstName: "Sarah",
    lastName: "Wilson",
    age: 29,
    city: "Houston",
    isActive: false,
    createdAt: new Date(),
    profile: {
      bio: "Data scientist and machine learning expert",
      skills: ["Python", "TensorFlow", "SQL", "R"],
      socialMedia: {
        linkedin: "sarah-wilson-data"
      }
    },
    preferences: {
      notifications: true,
      theme: "light",
      language: "en"
    }
  },
  {
    _id: ObjectId(),
    email: "david.brown@email.com",
    firstName: "David",
    lastName: "Brown",
    age: 35,
    city: "Phoenix",
    isActive: true,
    createdAt: new Date(),
    profile: {
      bio: "DevOps engineer and cloud architect",
      skills: ["Kubernetes", "AWS", "Terraform", "Jenkins"],
      socialMedia: {
        twitter: "@davidbrown",
        linkedin: "david-brown-devops"
      }
    },
    preferences: {
      notifications: false,
      theme: "dark",
      language: "en"
    }
  }
]);

// Create products collection
db.products.insertMany([
  {
    _id: ObjectId(),
    name: "iPhone 15 Pro",
    description: "Latest Apple smartphone with advanced features",
    price: 999.99,
    category: "Electronics",
    subcategory: "Smartphones",
    stockQuantity: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    specifications: {
      brand: "Apple",
      model: "iPhone 15 Pro",
      storage: "128GB",
      color: "Natural Titanium",
      screenSize: "6.1 inches",
      camera: "48MP"
    },
    tags: ["smartphone", "apple", "premium", "5g"],
    ratings: {
      average: 4.8,
      count: 1250,
      distribution: {
        5: 1000,
        4: 200,
        3: 30,
        2: 15,
        1: 5
      }
    },
    reviews: [
      {
        userId: "user1",
        rating: 5,
        comment: "Excellent phone with great camera quality",
        date: new Date(),
        helpful: 15
      },
      {
        userId: "user2",
        rating: 4,
        comment: "Good performance but expensive",
        date: new Date(),
        helpful: 8
      }
    ]
  },
  {
    _id: ObjectId(),
    name: "MacBook Air M2",
    description: "Lightweight laptop with M2 chip",
    price: 1199.99,
    category: "Electronics",
    subcategory: "Laptops",
    stockQuantity: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    specifications: {
      brand: "Apple",
      model: "MacBook Air",
      processor: "M2",
      memory: "8GB",
      storage: "256GB SSD",
      screenSize: "13.6 inches",
      weight: "2.7 lbs"
    },
    tags: ["laptop", "apple", "ultrabook", "m2"],
    ratings: {
      average: 4.7,
      count: 890,
      distribution: {
        5: 650,
        4: 180,
        3: 40,
        2: 15,
        1: 5
      }
    }
  },
  {
    _id: ObjectId(),
    name: "Nike Air Max 270",
    description: "Comfortable running shoes",
    price: 129.99,
    category: "Clothing",
    subcategory: "Shoes",
    stockQuantity: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
    specifications: {
      brand: "Nike",
      type: "Running Shoes",
      material: "Mesh and synthetic",
      sole: "Air Max cushioning",
      colors: ["Black", "White", "Red", "Blue"],
      sizes: [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12]
    },
    tags: ["shoes", "nike", "running", "comfortable"],
    ratings: {
      average: 4.5,
      count: 567,
      distribution: {
        5: 300,
        4: 180,
        3: 60,
        2: 20,
        1: 7
      }
    }
  },
  {
    _id: ObjectId(),
    name: "The Art of War",
    description: "Strategic thinking classic",
    price: 9.99,
    category: "Books",
    subcategory: "Philosophy",
    stockQuantity: 180,
    createdAt: new Date(),
    updatedAt: new Date(),
    specifications: {
      author: "Sun Tzu",
      publisher: "Penguin Classics",
      pages: 273,
      language: "English",
      format: "Paperback",
      isbn: "978-0140449624"
    },
    tags: ["book", "philosophy", "strategy", "classic"],
    ratings: {
      average: 4.3,
      count: 2150,
      distribution: {
        5: 1200,
        4: 650,
        3: 200,
        2: 70,
        1: 30
      }
    }
  },
  {
    _id: ObjectId(),
    name: "Coffee Maker",
    description: "Automatic drip coffee maker",
    price: 79.99,
    category: "Home & Garden",
    subcategory: "Kitchen Appliances",
    stockQuantity: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
    specifications: {
      brand: "Cuisinart",
      capacity: "12 cups",
      features: ["Programmable", "Auto shut-off", "Hot plate"],
      dimensions: "10 x 7 x 14 inches",
      weight: "5.2 lbs",
      warranty: "3 years"
    },
    tags: ["coffee", "kitchen", "appliance", "programmable"],
    ratings: {
      average: 4.2,
      count: 423,
      distribution: {
        5: 200,
        4: 150,
        3: 50,
        2: 18,
        1: 5
      }
    }
  }
]);

// Create orders collection
db.orders.insertMany([
  {
    _id: ObjectId(),
    orderId: "ORD-001",
    userId: ObjectId(),
    customerEmail: "john.doe@email.com",
    orderDate: new Date(),
    status: "completed",
    totalAmount: 1249.98,
    currency: "USD",
    shippingAddress: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA"
    },
    billingAddress: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA"
    },
    items: [
      {
        productId: ObjectId(),
        productName: "iPhone 15 Pro",
        quantity: 1,
        unitPrice: 999.99,
        totalPrice: 999.99,
        specifications: {
          color: "Natural Titanium",
          storage: "128GB"
        }
      },
      {
        productId: ObjectId(),
        productName: "AirPods Pro",
        quantity: 1,
        unitPrice: 249.99,
        totalPrice: 249.99
      }
    ],
    payment: {
      method: "credit_card",
      cardLast4: "1234",
      transactionId: "txn_1234567890",
      status: "paid",
      paidAt: new Date()
    },
    shipping: {
      method: "standard",
      cost: 0,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trackingNumber: "TRK123456789"
    },
    timeline: [
      {
        status: "placed",
        timestamp: new Date(),
        note: "Order placed successfully"
      },
      {
        status: "confirmed",
        timestamp: new Date(),
        note: "Payment confirmed"
      },
      {
        status: "shipped",
        timestamp: new Date(),
        note: "Order shipped via UPS"
      },
      {
        status: "completed",
        timestamp: new Date(),
        note: "Order delivered successfully"
      }
    ]
  },
  {
    _id: ObjectId(),
    orderId: "ORD-002",
    userId: ObjectId(),
    customerEmail: "jane.smith@email.com",
    orderDate: new Date(),
    status: "shipped",
    totalAmount: 179.99,
    currency: "USD",
    shippingAddress: {
      street: "456 Oak Ave",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      country: "USA"
    },
    items: [
      {
        productId: ObjectId(),
        productName: "Adidas Ultraboost",
        quantity: 1,
        unitPrice: 179.99,
        totalPrice: 179.99,
        specifications: {
          size: "9",
          color: "Black"
        }
      }
    ],
    payment: {
      method: "paypal",
      transactionId: "pp_9876543210",
      status: "paid",
      paidAt: new Date()
    },
    shipping: {
      method: "express",
      cost: 15.99,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      trackingNumber: "TRK987654321"
    },
    timeline: [
      {
        status: "placed",
        timestamp: new Date(),
        note: "Order placed successfully"
      },
      {
        status: "confirmed",
        timestamp: new Date(),
        note: "Payment confirmed"
      },
      {
        status: "shipped",
        timestamp: new Date(),
        note: "Order shipped via FedEx"
      }
    ]
  },
  {
    _id: ObjectId(),
    orderId: "ORD-003",
    userId: ObjectId(),
    customerEmail: "mike.johnson@email.com",
    orderDate: new Date(),
    status: "pending",
    totalAmount: 89.98,
    currency: "USD",
    shippingAddress: {
      street: "789 Pine St",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA"
    },
    items: [
      {
        productId: ObjectId(),
        productName: "Nike Air Max 270",
        quantity: 1,
        unitPrice: 129.99,
        totalPrice: 129.99,
        specifications: {
          size: "10",
          color: "White"
        }
      },
      {
        productId: ObjectId(),
        productName: "Coffee Maker",
        quantity: 1,
        unitPrice: 79.99,
        totalPrice: 79.99
      }
    ],
    payment: {
      method: "credit_card",
      cardLast4: "5678",
      status: "pending"
    },
    shipping: {
      method: "standard",
      cost: 0,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    timeline: [
      {
        status: "placed",
        timestamp: new Date(),
        note: "Order placed, awaiting payment confirmation"
      }
    ]
  }
]);

// Create analytics collection for aggregated data
db.analytics.insertMany([
  {
    _id: ObjectId(),
    type: "daily_sales",
    date: new Date(),
    metrics: {
      totalOrders: 15,
      totalRevenue: 3245.67,
      averageOrderValue: 216.38,
      topCategory: "Electronics",
      newCustomers: 5,
      returningCustomers: 10
    },
    breakdown: {
      byCategory: {
        "Electronics": 2100.50,
        "Clothing": 890.25,
        "Books": 155.92,
        "Home & Garden": 99.00
      },
      byHour: {
        "09": 250.00,
        "10": 450.25,
        "11": 320.50,
        "12": 180.75,
        "13": 290.00,
        "14": 410.25,
        "15": 380.50,
        "16": 520.75,
        "17": 432.67
      }
    }
  },
  {
    _id: ObjectId(),
    type: "product_performance",
    date: new Date(),
    productId: ObjectId(),
    productName: "iPhone 15 Pro",
    metrics: {
      views: 1250,
      sales: 15,
      revenue: 14999.85,
      conversionRate: 1.2,
      returnRate: 0.5,
      avgRating: 4.8
    },
    demographics: {
      ageGroups: {
        "18-25": 3,
        "26-35": 8,
        "36-45": 3,
        "46-55": 1
      },
      locations: {
        "New York": 5,
        "California": 4,
        "Texas": 3,
        "Florida": 2,
        "Others": 1
      }
    }
  }
]);

// Create categories collection with hierarchical structure
db.categories.insertMany([
  {
    _id: ObjectId(),
    name: "Electronics",
    slug: "electronics",
    description: "Electronic devices and accessories",
    parentId: null,
    level: 0,
    isActive: true,
    sortOrder: 1,
    metadata: {
      icon: "electronics",
      color: "#3B82F6",
      seoKeywords: ["electronics", "devices", "technology"],
      featuredProducts: 5
    },
    subcategories: [
      {
        _id: ObjectId(),
        name: "Smartphones",
        slug: "smartphones",
        description: "Mobile phones and accessories",
        level: 1,
        sortOrder: 1
      },
      {
        _id: ObjectId(),
        name: "Laptops",
        slug: "laptops",
        description: "Portable computers",
        level: 1,
        sortOrder: 2
      },
      {
        _id: ObjectId(),
        name: "Accessories",
        slug: "accessories",
        description: "Electronic accessories and peripherals",
        level: 1,
        sortOrder: 3
      }
    ]
  },
  {
    _id: ObjectId(),
    name: "Clothing",
    slug: "clothing",
    description: "Apparel and fashion items",
    parentId: null,
    level: 0,
    isActive: true,
    sortOrder: 2,
    metadata: {
      icon: "clothing",
      color: "#8B5CF6",
      seoKeywords: ["clothing", "fashion", "apparel"],
      featuredProducts: 3
    },
    subcategories: [
      {
        _id: ObjectId(),
        name: "Shoes",
        slug: "shoes",
        description: "Footwear for all occasions",
        level: 1,
        sortOrder: 1
      },
      {
        _id: ObjectId(),
        name: "Tops",
        slug: "tops",
        description: "Shirts, t-shirts, and tops",
        level: 1,
        sortOrder: 2
      }
    ]
  },
  {
    _id: ObjectId(),
    name: "Books",
    slug: "books",
    description: "Books and educational materials",
    parentId: null,
    level: 0,
    isActive: true,
    sortOrder: 3,
    metadata: {
      icon: "book",
      color: "#10B981",
      seoKeywords: ["books", "reading", "education"],
      featuredProducts: 2
    },
    subcategories: [
      {
        _id: ObjectId(),
        name: "Fiction",
        slug: "fiction",
        description: "Fictional literature",
        level: 1,
        sortOrder: 1
      },
      {
        _id: ObjectId(),
        name: "Non-Fiction",
        slug: "non-fiction",
        description: "Educational and factual books",
        level: 1,
        sortOrder: 2
      }
    ]
  }
]);

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "city": 1 });
db.users.createIndex({ "isActive": 1 });
db.users.createIndex({ "profile.skills": 1 });

db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1, "subcategory": 1 });
db.products.createIndex({ "price": 1 });
db.products.createIndex({ "stockQuantity": 1 });
db.products.createIndex({ "ratings.average": -1 });
db.products.createIndex({ "tags": 1 });

db.orders.createIndex({ "orderId": 1 }, { unique: true });
db.orders.createIndex({ "customerEmail": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "orderDate": -1 });
db.orders.createIndex({ "totalAmount": 1 });

db.analytics.createIndex({ "type": 1, "date": -1 });
db.analytics.createIndex({ "productId": 1, "date": -1 });

db.categories.createIndex({ "slug": 1 }, { unique: true });
db.categories.createIndex({ "parentId": 1 });
db.categories.createIndex({ "level": 1, "sortOrder": 1 });

print("MongoDB test database initialized with sample data!");
print("Collections created: users, products, orders, analytics, categories");
print("Sample data and indexes added successfully.");
