# ShopSphere - Full-Stack E-commerce Application

ShopSphere is a modern, full-stack e-commerce platform built with cutting-edge technologies, featuring an intelligent product recommendation system.

## 🚀 Features

- **Modern Frontend**: React with TypeScript, Redux for state management, Tailwind CSS for styling, and Swiper for carousels
- **Robust Backend**: Spring Boot with JWT authentication, Keycloak integration, and Spring JPA
- **Intelligent Recommendations**: Product recommendation system that suggests complementary items (e.g., phone → phone cover + data cable)
- **Caching**: Redis integration for improved performance
- **Containerized**: Docker support for easy deployment
- **Database**: MySQL for persistent data storage

## 🛠️ Technology Stack

### Frontend
- React 19 with TypeScript
- Redux Toolkit for state management
- Tailwind CSS for styling
- Swiper for carousel components
- React Router for navigation
- Axios for API calls

### Backend
- Spring Boot 3.2.0
- Spring Security with JWT
- Keycloak for identity management
- Spring Data JPA
- MySQL Database
- Redis for caching

### Infrastructure
- Docker & Docker Compose
- MySQL 8.0
- Redis 7
- Keycloak 23.0

## 📁 Project Structure

```
Ecommerce_project/
├── shopsphere-frontend/     # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store and slices
│   │   └── hooks/          # Custom hooks
│   └── package.json
│
├── shopsphere-backend/      # Spring Boot backend
│   ├── src/main/java/com/shopsphere/
│   │   ├── controller/     # REST controllers
│   │   ├── service/        # Business logic
│   │   ├── repository/     # Data access layer
│   │   ├── model/          # Entity models
│   │   └── config/         # Configuration classes
│   └── pom.xml
│
└── docker-compose.yml       # Docker orchestration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Java 17+
- Maven 3.9+
- Docker and Docker Compose (optional, for containerized setup)

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Start Infrastructure Services (Docker)**

   ```bash
   docker-compose up -d mysql redis keycloak
   ```

   This will start:
   - MySQL on port 3306
   - Redis on port 6379
   - Keycloak on port 8081

3. **Backend Setup**

   ```bash
   cd shopsphere-backend
   mvn clean install
   mvn spring-boot:run
   ```

   The backend will run on `http://localhost:8080`

4. **Frontend Setup**

   ```bash
   cd shopsphere-frontend
   npm install
   npm start
   ```

   The frontend will run on `http://localhost:3000`

### Using Docker (Full Stack)

To run everything with Docker:

```bash
docker-compose up --build
```

This will start all services including the backend and frontend.

## 🎯 Key Features

### Product Recommendation System

The recommendation system works by:

1. **Product Associations**: Products can be associated with complementary items
2. **Association Strength**: Each association has a strength value indicating relevance
3. **Smart Recommendations**: When viewing a product, related items are suggested
4. **Cart Recommendations**: Based on items in cart, additional products are recommended

Example: When a customer views a phone, the system automatically recommends:
- Phone covers
- Data cables
- Screen protectors
- Other complementary accessories

### API Endpoints

#### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product by ID
- `GET /api/products/{id}/recommendations` - Get product recommendations
- `GET /api/products/search?q={query}` - Search products
- `GET /api/products/category/{category}` - Get products by category

#### Cart
- `GET /api/cart/{userId}` - Get user's cart
- `POST /api/cart/{userId}/add` - Add item to cart
- `DELETE /api/cart/{userId}/remove/{productId}` - Remove item from cart
- `GET /api/cart/{userId}/recommendations` - Get cart-based recommendations

## 🔧 Configuration

### Backend Configuration

Edit `shopsphere-backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/shopsphere_db
    username: root
    password: rootpassword
  data:
    redis:
      host: localhost
      port: 6379
```

### Frontend Configuration

API URL is configured in Redux slices. Update `API_URL` in:
- `src/store/slices/productSlice.ts`
- `src/store/slices/cartSlice.ts`

## 📝 Database Schema

- **users**: User accounts and authentication
- **products**: Product catalog
- **product_associations**: Product recommendation relationships
- **cart**: Shopping cart items
- **orders**: Order history
- **order_items**: Order line items

## 🧪 Testing

### Backend Tests
```bash
cd shopsphere-backend
mvn test
```

### Frontend Tests
```bash
cd shopsphere-frontend
npm test
```

## 🚢 Deployment

### Production Build

**Frontend:**
```bash
cd shopsphere-frontend
npm run build
```

**Backend:**
```bash
cd shopsphere-backend
mvn clean package
java -jar target/shopsphere-backend-1.0.0.jar
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- ShopSphere Development Team

## 🙏 Acknowledgments

- Design inspiration from Figma community templates
- Spring Boot and React communities for excellent documentation

---

**ShopSphere** - Your one-stop shopping destination! 🛒✨

