import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApp, Product } from './context/AppContext';
import { RootStackParamList } from '../App';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SellProps {
  mode: 'Buyer' | 'Seller';
}

export default function SellScreen({ mode }: SellProps) {
  const { watchlist, setActiveAuctionItem } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();

  // 確定選擇並進入競拍房間
  const handleStartAuction = () => {
    const selectedProduct = watchlist.find((item) => item.id === selectedId);

    if (!selectedProduct) {
      Alert.alert('Selection Required', 'Please select a product from your watchlist to start the auction.');
      return;
    }

    // 1. 將選中的商品設置為全域當前競拍商品
    setActiveAuctionItem(selectedProduct);

    // 2. 導航跳轉到 AuctionRoom 頁面
    navigation.navigate('AuctionRoom', {
      auctionId: selectedProduct.id,
      title: selectedProduct.title,
    });
  };

  const renderItem = ({ item }: { item: Product }) => {
    const isSelected = item.id === selectedId;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => setSelectedId(item.id)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.image }} style={styles.cardImage} />

        <View style={styles.cardDetails}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardPrice}>Base Bid: ${item.price}</Text>
          <Text style={styles.cardDesc} numberOfLines={1}>
            {item.description}
          </Text>
        </View>

        {/* 勾選圈圈標籤 */}
        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部 Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Launch Auction</Text>
          <Text style={styles.headerSubtitle}>Select an item from Watchlist to start</Text>
        </View>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>{mode} Mode</Text>
        </View>
      </View>

      {/* 點讚商品選擇清單 */}
      {watchlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="add-circle-outline" size={70} color="#ccc" />
          <Text style={styles.emptyTitle}>Watchlist is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Please like items in the Search tab first before launching an auction here.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={watchlist}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
          />

          {/* 底部確定按鈕 */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.confirmBtn, !selectedId && styles.disabledBtn]}
              disabled={!selectedId}
              onPress={handleStartAuction}
            >
              <Text style={styles.confirmBtnText}>
                {selectedId ? 'Confirm & Enter Auction' : 'Select an Item First'}
              </Text>
              {selectedId && <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>
          </View>
        </>
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
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  cardImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardPrice: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
    marginTop: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  confirmBtn: {
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#bdc3c7',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});