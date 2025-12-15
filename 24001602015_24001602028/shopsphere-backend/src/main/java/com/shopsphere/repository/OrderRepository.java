package com.shopsphere.repository;

import com.shopsphere.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // Query orders by user ID using EntityGraph for eager loading
    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "user"})
    @Query("SELECT o FROM Order o WHERE o.user.id = :userId ORDER BY o.createdAt DESC")
    List<Order> findByUserId(@Param("userId") Long userId);
    
    // Alternative query using JOIN
    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "user"})
    @Query("SELECT o FROM Order o JOIN o.user u WHERE u.id = :userId ORDER BY o.createdAt DESC")
    List<Order> findByUser_Id(@Param("userId") Long userId);
    
    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "user"})
    @Query("SELECT o FROM Order o WHERE o.status != 'CANCELLED'")
    List<Order> findAllWithOrderItems();
}









