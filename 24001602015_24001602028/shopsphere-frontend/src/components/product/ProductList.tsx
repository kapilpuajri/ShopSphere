import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ProductCard from './ProductCard';
import { Product } from '../../store/slices/productSlice';

interface ProductListProps {
  products: Product[];
  title?: string;
  showCarousel?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  title, 
  showCarousel = false 
}) => {
  if (showCarousel) {
    return (
      <div className="my-8">
        {title && (
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">{title}</h2>
        )}
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 3000 }}
          className="pb-12"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );
  }

  return (
    <div className="my-8">
      {title && (
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;

