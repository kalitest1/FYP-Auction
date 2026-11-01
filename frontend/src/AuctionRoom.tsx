import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { AppContext } from './context/AppContext';
import { io } from 'socket.io-client';

// 連線到你的後端伺服器 (若用實機測試，請將 localhost 改為電腦區網 IP)
const SOCKET_URL = 'https://auction-backend-vgus.onrender.com';
const socket = io(SOCKET_URL);

type AuctionRoomRouteProp = RouteProp<RootStackParamList, 'AuctionRoom'>;

interface BidRecord {
  id: string;
  bidderName: string;
  amount: number;
  time: string;
}

export default function AuctionRoomScreen() {
  const route = useRoute<AuctionRoomRouteProp>();
  const navigation = useNavigation();
  const { auctionId, title } = route.params || {};

  const { products, addActivityNotice } = useContext(AppContext);
  
  // 🔍 精準透過 auctionId 尋找對應商品，若找不到則預設為第一個商品
  const product = products.find((p) => p.id === auctionId) || products[0];

  const [currentBid, setCurrentBid] = useState<number>(product ? product.price : 100);
  const [customBid, setCustomBid] = useState<string>('');
  
  // ⏱️ 60 秒倒數計時
  const [timeLeft, setTimeLeft] = useState<number>(30);
  
  const [bids, setBids] = useState<BidRecord[]>([
    { id: '1', bidderName: 'John Doe', amount: product ? product.price : 100, time: '2 mins ago' },
  ]);

  // 1. Socket.io 連線與房間加入
  useEffect(() => {
    const targetId = auctionId || product?.id || '1';
    socket.emit('join_room', targetId);

    // 監聽來自後端的即時出價廣播
    socket.on('new_bid', (newBid: BidRecord) => {
      setBids((prevBids) => [newBid, ...prevBids]);
      setCurrentBid(newBid.amount);
    });

    return () => {
      socket.off('new_bid');
    };
  }, [auctionId, product]);

  // 2. 倒數計時器與自動結算邏輯
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          
          const hasUserBid = bids.some((b) => b.bidderName.includes('You'));
          const finalStatus = hasUserBid ? 'SUCCESS' : 'FAILED';

          // 寫入全局 Activity 通知
          addActivityNotice({
            id: Date.now().toString(),
            productTitle: product ? product.title : 'Auction Item',
            finalPrice: currentBid,
            status: finalStatus,
            timestamp: 'Just now',
          });

          Alert.alert(
            'Auction Ended!',
            hasUserBid
              ? `Congratulations! You won the auction for "${product?.title}" at $${currentBid}!`
              : `The auction has ended. Winning bid was $${currentBid}.`,
            [{ text: 'View Activity', onPress: () => navigation.goBack() }]
          );

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, currentBid, bids, product, navigation, addActivityNotice]);

  // 3. 處理出價動作
  const handlePlaceBid = (amount: number) => {
    if (timeLeft === 0) {
      Alert.alert('Auction Closed', 'This auction has already ended. You can no longer place bids.');
      return;
    }

    if (amount <= currentBid) {
      Alert.alert('Invalid Bid', 'Your bid must be higher than the current highest bid.');
      return;
    }

    const targetId = auctionId || product?.id || '1';

    // 透過 Socket 發送出價給後端
    socket.emit('place_bid', {
      productId: targetId,
      bidderName: 'You (Alex)',
      amount: amount,
    });

    // 同步在本地畫面直接推入一筆，確保手感即時響應
    const myNewBid: BidRecord = {
      id: Date.now().toString(),
      bidderName: 'You (Alex)',
      amount: amount,
      time: 'Just now',
    };
    setBids((prev) => [myNewBid, ...prev]);
    setCurrentBid(amount);
    setCustomBid('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `00:${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* 🖼️ 恢復商品圖片顯示 */}
      {product?.image ? (
        <Image source={{ uri: product.image }} style={styles.productImage} />
      ) : null}

      <Text style={styles.title}>{title || product?.title || 'Auction Item'}</Text>
      <Text style={styles.description}>{product?.description}</Text>
      
      {/* 倒數計時顯示 */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          {timeLeft === 0 ? 'AUCTION ENDED' : `Time Left: ${formatTime(timeLeft)}`}
        </Text>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.label}>Current Highest Bid:</Text>
        <Text style={styles.price}>${currentBid}</Text>
      </View>

      {/* 快速出價按鈕 */}
      <View style={styles.quickBidRow}>
        {[10, 50, 100].map((inc) => (
          <TouchableOpacity
            key={inc}
            style={[styles.quickBidBtn, timeLeft === 0 && styles.disabledBtn]}
            disabled={timeLeft === 0}
            onPress={() => handlePlaceBid(currentBid + inc)}
          >
            <Text style={[styles.quickBidText, timeLeft === 0 && { color: '#888' }]}>
              +${inc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 自訂出價區塊 */}
      <View style={styles.customBidRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter custom bid"
          keyboardType="numeric"
          value={customBid}
          onChangeText={setCustomBid}
          editable={timeLeft > 0}
        />
        <TouchableOpacity
          style={[styles.submitBtn, timeLeft === 0 && styles.disabledBtn]}
          disabled={timeLeft === 0}
          onPress={() => {
            const val = parseFloat(customBid);
            if (!isNaN(val)) {
              handlePlaceBid(val);
            } else {
              Alert.alert('Error', 'Please enter a valid number');
            }
          }}
        >
          <Text style={styles.submitBtnText}>
            {timeLeft === 0 ? 'Closed' : 'Bid'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 出價歷史紀錄 */}
      <Text style={styles.historyTitle}>Live Bid History</Text>
      {bids.map((bid) => (
        <View key={bid.id} style={styles.bidItem}>
          <Text style={styles.bidder}>{bid.bidderName}</Text>
          <Text style={styles.bidAmount}>${bid.amount}</Text>
          <Text style={styles.bidTime}>{bid.time}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  productImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 15, resizeMode: 'cover' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  description: { fontSize: 14, color: '#666', marginBottom: 15 },
  timerContainer: { backgroundColor: '#FF3B30', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  timerText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  priceContainer: { marginBottom: 20, alignItems: 'center' },
  label: { fontSize: 14, color: '#666' },
  price: { fontSize: 32, fontWeight: 'bold', color: '#007AFF' },
  quickBidRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  quickBidBtn: { flex: 1, backgroundColor: '#E5E5EA', padding: 12, marginHorizontal: 5, borderRadius: 8, alignItems: 'center' },
  quickBidText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  customBidRow: { flexDirection: 'row', marginBottom: 25 },
  input: { flex: 2, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, height: 45, marginRight: 10 },
  submitBtn: { flex: 1, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabledBtn: { backgroundColor: '#d1d1d6' },
  historyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  bidItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  bidder: { fontSize: 14, fontWeight: '600' },
  bidAmount: { fontSize: 14, fontWeight: 'bold', color: '#007AFF' },
  bidTime: { fontSize: 12, color: '#888' },
});