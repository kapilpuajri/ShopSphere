package com.shopsphere.repository;

import com.shopsphere.model.ProductAssociation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductAssociationRepository extends JpaRepository<ProductAssociation, Long> {
    List<ProductAssociation> findByProductId(Long productId);
    
    @Query("SELECT pa FROM ProductAssociation pa WHERE pa.product.id = :productId ORDER BY pa.associationStrength DESC")
    List<ProductAssociation> findTopAssociationsByProductId(Long productId);
}

