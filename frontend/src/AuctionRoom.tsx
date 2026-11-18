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
import { io, Socket } from 'socket.io-client';

// 💡 修正：移除多餘的括號與重複網址
const SOCKET_URL = 'https://auction-backend-vgus.onrender.com';

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
  
  const product = products.find((p) => p.id === auctionId) || products[0];

  const [currentBid, setCurrentBid] = useState<number>(product ? product.price : 100);
  const [customBid, setCustomBid] = useState<string>('');
  
  const [timeLeft, setTimeLeft] = useState<number>(30);
  
  const [bids, setBids] = useState<BidRecord[]>([]);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [myTag, setMyTag] = useState<string>('');

  // 1. Socket.io Connection and Room Management (💡 修正：只依賴 auctionId，避免重複斷線重連)
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    setSocket(newSocket);

    const targetId = auctionId || product?.id || '1';

    newSocket.on('connect', () => {
      const shortId = newSocket.id ? newSocket.id.substring(0, 4) : 'Guest';
      const generatedTag = `User_${shortId}`;
      setMyTag(generatedTag);
      console.log('Connected to Socket server as:', generatedTag, 'joining room:', targetId);
      newSocket.emit('join_room', targetId);
    });

    // Listen for real-time broadcast bids from backend
    newSocket.on('new_bid', (newBid: any) => {
      const resolvedName = newBid.bidderName || newBid.bidder_name || 'Unknown User';

      const formattedBid: BidRecord = {
        id: newBid.id || Date.now().toString(),
        bidderName: resolvedName,
        amount: Number(newBid.amount),
        time: newBid.time || 'Just now',
      };

      setBids((prevBids) => {
        if (prevBids.some((b) => b.id === formattedBid.id)) return prevBids;
        return [formattedBid, ...prevBids];
      });
      setCurrentBid(formattedBid.amount);
    });

    // Listen for bid rejection/errors from backend
    newSocket.on('bid_error', (err: { message: string }) => {
      Alert.alert('Bid Rejected', err.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [auctionId]);

  // 2. Countdown Timer (💡 修正：將依賴改為空陣列或獨立狀態，避免每次出價或更新金額時重置倒數計時)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 3. Handle Auction End Trigger (獨立處理結束結算與跳轉)
  useEffect(() => {
    if (timeLeft === 0) {
      const hasUserBid = bids.some((b) => b.bidderName === myTag);
      const finalStatus = hasUserBid ? 'SUCCESS' : 'FAILED';

      setTimeout(() => {
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
      }, 0);
    }
  }, [timeLeft]);

  // 4. Handle Bid Action
  const handlePlaceBid = (amount: number) => {
    if (timeLeft === 0) {
      Alert.alert('Auction Closed', 'This auction has already ended. You can no longer place bids.');
      return;
    }

    if (amount <= currentBid) {
      Alert.alert('Invalid Bid', `Your bid must be higher than the current highest bid ($${currentBid}).`);
      return;
    }

    if (!socket) {
      Alert.alert('Connection Error', 'Socket is not connected.');
      return;
    }

    const targetId = auctionId || product?.id || '1';

    socket.emit('place_bid', {
      productId: targetId,
      amount: amount,
    });

    setCustomBid('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `00:${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <ScrollView style={styles.container}>
      {product?.image ? (
        <Image source={{ uri: product.image }} style={styles.productImage} />
      ) : null}

      <Text style={styles.title}>{title || product?.title || 'Auction Item'}</Text>
      <Text style={styles.description}>{product?.description}</Text>
      
      {myTag ? <Text style={styles.sessionBadge}>Your Session: {myTag}</Text> : null}
      
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          {timeLeft === 0 ? 'AUCTION ENDED' : `Time Left: ${formatTime(timeLeft)}`}
        </Text>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.label}>Current Highest Bid:</Text>
        <Text style={styles.price}>${currentBid}</Text>
      </View>

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

      <Text style={styles.historyTitle}>Live Bid History</Text>
      {bids.map((bid) => {
        const isMe = bid.bidderName === myTag;
        const displayName = bid.bidderName || 'Unknown User';

        return (
          <View key={bid.id} style={styles.bidItem}>
            <Text style={[styles.bidder, isMe && styles.myBidderText]}>
              {displayName} {isMe ? '(You)' : ''}
            </Text>
            <Text style={styles.bidAmount}>${bid.amount}</Text>
            <Text style={styles.bidTime}>{bid.time}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  productImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 15, resizeMode: 'cover' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  description: { fontSize: 14, color: '#666', marginBottom: 10 },
  sessionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f0fe',
    color: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 15,
  },
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
  bidItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  bidder: { fontSize: 14, fontWeight: '600', color: '#333' },
  myBidderText: { color: '#007AFF', fontWeight: 'bold' },
  bidAmount: { fontSize: 14, fontWeight: 'bold', color: '#27ae60' },
  bidTime: { fontSize: 12, color: '#888' },
});