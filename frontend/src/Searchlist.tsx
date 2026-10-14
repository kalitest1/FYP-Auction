import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useApp, Product } from './context/AppContext';
import { RootStackParamList } from '../App';

type SearchListRouteProp = RouteProp<RootStackParamList, 'SearchList'>;

export default function SearchListScreen() {
  const route = useRoute<SearchListRouteProp>();
  const { query, category } = route.params || {};
  
  const { products, watchlist, toggleWatchlist } = useApp();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 根據傳入的 query 或 category 過濾商品
  const filteredProducts = products.filter((item) => {
    if (query) {
      return item.title.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  });

  const renderItem = ({ item }: { item: Product }) => {
    const isLiked = watchlist.some((w) => w.id === item.id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedProduct(item)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        
        {/* 愛心收藏按鈕 */}
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => toggleWatchlist(item)}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? '#e74c3c' : '#fff'}
          />
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardPrice}>Starting Bid: ${item.price}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 搜尋條件提示資訊 */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          Showing results for: <Text style={styles.highlightText}>{query || category || 'All Items'}</Text>
        </Text>
        <Text style={styles.countText}>({filteredProducts.length} items found)</Text>
      </View>

      {/* 商品列表 */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={70} color="#ccc" />
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptySubtitle}>Try searching for something else!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* 商品詳情 Modal */}
      {selectedProduct && (
        <Modal animationType="slide" transparent={true} visible={!!selectedProduct}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedProduct.image }} style={styles.modalImage} />
              <Text style={styles.modalTitle}>{selectedProduct.title}</Text>
              <Text style={styles.modalPrice}>Starting Bid: ${selectedProduct.price}</Text>
              <Text style={styles.modalDesc}>{selectedProduct.description}</Text>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedProduct(null)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  infoBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  countText: {
    fontSize: 12,
    color: '#888',
  },
  listContainer: {
    padding: 8,
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    padding: 6,
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  cardPrice: {
    fontSize: 13,
    color: '#27ae60',
    marginTop: 4,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },
  modalPrice: {
    fontSize: 18,
    color: '#27ae60',
    marginVertical: 8,
    fontWeight: 'bold',
  },
  modalDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  closeBtn: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});