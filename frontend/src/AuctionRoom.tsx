import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useApp } from './context/AppContext';

type AuctionRoomRouteProp = RouteProp<RootStackParamList, 'AuctionRoom'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

interface BidRecord {
  id: string;
  bidderName: string;
  amount: number;
  time: string;
}

export default function AuctionRoomScreen() {
  const route = useRoute<AuctionRoomRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { productId } = route.params;
  const { products, watchlist, toggleWatchlist, addActivity } = useApp();

  const product = products.find((p) => p.id === productId) || products[0];

  const [currentBid, setCurrentBid] = useState<number>(product ? product.price : 100);
  const [customBid, setCustomBid] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(3600); // 1 hour countdown in seconds
  const [bids, setBids] = useState<BidRecord[]>([
    { id: '1', bidderName: 'User_882', amount: product ? product.price - 20 : 80, time: '10 mins ago' },
    { id: '2', bidderName: 'Collector_X', amount: product ? product.price : 100, time: '2 mins ago' },
  ]);

  const isLiked = product ? watchlist.some((w) => w.id === product.id) : false;

  // 倒數計時器邏輯
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 出價處理邏輯
  const handlePlaceBid = (amount: number) => {
    if (amount <= currentBid) {
      Alert.alert('Invalid Bid', 'Your bid must be higher than the current highest bid.');
      return;
    }

    const newBid: BidRecord = {
      id: Date.now().toString(),
      bidderName: 'You (Alex)',
      amount,
      time: 'Just now',
    };

    setCurrentBid(amount);
    setBids([newBid, ...bids]);
    setCustomBid('');

    // 新增出價通知紀錄至 AppContext
    addActivity({
      id: Date.now().toString(),
      productId: product.id,
      productTitle: product.title,
      finalPrice: amount,
      status: 'SUCCESS',
      timestamp: 'Just now',
    });

    Alert.alert('Bid Placed!', `Your bid of $${amount} has been successfully submitted.`);
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFoundContainer}>
          <Text>Product not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.title}
        </Text>
        <TouchableOpacity onPress={() => toggleWatchlist(product)} style={styles.likeButton}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? '#e74c3c' : '#333'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 商品主圖與倒數計時橫條 */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={16} color="#fff" />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        {/* 價格與統計數據區塊 */}
        <View style={styles.detailsCard}>
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.categoryBadge}>{product.category}</Text>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Current Highest Bid</Text>
              <Text style={styles.currentPrice}>${currentBid}</Text>
            </View>
            <View style={styles.bidCountBadge}>
              <Text style={styles.bidCountText}>{bids.length} Bids</Text>
            </View>
          </View>

          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* 快速出價與自訂出價區塊 */}
        <View style={styles.bidActionCard}>
          <Text style={styles.sectionTitle}>Place Your Bid</Text>
          <View style={styles.quickBidRow}>
            {[10, 50, 100].map((inc) => (
              <TouchableOpacity
                key={inc}
                style={styles.quickBidBtn}
                onPress={() => handlePlaceBid(currentBid + inc)}
              >
                <Text style={styles.quickBidText}>+${inc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customBidRow}>
            <View style={styles.inputPrefix}>
              <Text style={styles.prefixText}>$</Text>
              <TextInput
                style={styles.customBidInput}
                placeholder={`> ${currentBid}`}
                keyboardType="numeric"
                value={customBid}
                onChangeText={setCustomBid}
              />
            </View>
            <TouchableOpacity
              style={styles.submitBidBtn}
              onPress={() => {
                const val = parseFloat(customBid);
                if (!isNaN(val)) handlePlaceBid(val);
              }}
            >
              <Text style={styles.submitBidText}>Submit Bid</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 出價歷史紀錄 */}
        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Bid History</Text>
          {bids.map((b) => (
            <View key={b.id} style={styles.historyItem}>
              <View style={styles.bidderInfo}>
                <Ionicons name="person-circle-outline" size={24} color="#666" />
                <Text style={styles.bidderName}>{b.bidderName}</Text>
              </View>
              <View style={styles.bidAmountInfo}>
                <Text style={styles.historyAmount}>${b.amount}</Text>
                <Text style={styles.historyTime}>{b.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  likeButton: {
    padding: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 260,
    backgroundColor: '#e0e0e0',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  timerBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 13,
  },
  detailsCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    color: '#666',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginVertical: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#888',
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
    marginTop: 2,
  },
  bidCountBadge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bidCountText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginTop: 8,
  },
  bidActionCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  quickBidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickBidBtn: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#d0dbe5',
  },
  quickBidText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  customBidRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputPrefix: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    height: 44,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 6,
  },
  customBidInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  submitBidBtn: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBidText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  historyCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  bidderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidderName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  bidAmountInfo: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  historyTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
});