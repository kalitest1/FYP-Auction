import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApp, Product } from './context/AppContext';
import { RootStackParamList } from '../App';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SearchProps {
  mode: 'Buyer' | 'Seller';
}

const CATEGORIES = ['All', 'Watches', 'Jewelry', 'Art', 'Sneakers', 'Electronics'];

export default function SearchScreen({ mode }: SearchProps) {
  const { products, watchlist, toggleWatchlist } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const navigation = useNavigation<NavigationProp>();

  // 提交搜尋或選擇分類後，跳轉至 SearchList 頁面
  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 0) {
      navigation.navigate('SearchList', { query: searchQuery });
    }
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    if (category !== 'All') {
      navigation.navigate('SearchList', { category });
    }
  };

  // 本地列表過濾 (搭配搜尋欄輸入)
  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProductItem = ({ item }: { item: Product }) => {
    const isLiked = watchlist.some((w) => w.id === item.id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedProduct(item)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.image }} style={styles.cardImage} />

        {/* 點讚愛心按鈕 */}
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
      {/* 頂部 Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Auctions</Text>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>{mode} Mode</Text>
        </View>
      </View>

      {/* 搜尋輸入框 */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items, brands, or categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      {/* 分類快速選單 */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.selectedCategoryChip,
              ]}
              onPress={() => handleCategoryPress(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.selectedCategoryText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 商品展牆 (雙排網格) */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderProductItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* 商品詳情彈窗 Modal */}
      {selectedProduct && (
        <Modal animationType="slide" transparent={true} visible={!!selectedProduct}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedProduct.image }} style={styles.modalImage} />
              <Text style={styles.modalTitle}>{selectedProduct.title}</Text>
              <Text style={styles.modalPrice}>Starting Bid: ${selectedProduct.price}</Text>
              <Text style={styles.modalDesc}>{selectedProduct.description}</Text>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[
                    styles.likeModalBtn,
                    watchlist.some((w) => w.id === selectedProduct.id) && styles.likedModalBtn,
                  ]}
                  onPress={() => toggleWatchlist(selectedProduct)}
                >
                  <Ionicons
                    name={
                      watchlist.some((w) => w.id === selectedProduct.id)
                        ? 'heart'
                        : 'heart-outline'
                    }
                    size={20}
                    color={
                      watchlist.some((w) => w.id === selectedProduct.id)
                        ? '#e74c3c'
                        : '#333'
                    }
                  />
                  <Text style={styles.likeModalBtnText}>
                    {watchlist.some((w) => w.id === selectedProduct.id) ? 'Liked' : 'Like'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedProduct(null)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modeBadge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  categoryContainer: {
    paddingVertical: 12,
    paddingLeft: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eef1f6',
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20,
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
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  likeModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  likedModalBtn: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  likeModalBtnText: {
    marginLeft: 6,
    fontWeight: '600',
    color: '#333',
  },
  closeBtn: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});