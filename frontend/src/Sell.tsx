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
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { useApp, Product } from './context/AppContext';
import { RootStackParamList } from '../App';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客戶端
const SUPABASE_URL = 'https://tbcroqqnpsldptfjdsfo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiY3JvcXFucHNsZHB0Zmpkc2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5Nzg5ODMsImV4cCI6MjEwNzU1NDk4M30.nuXLnQuV_tm_gJPYslN5TTPWbrwmbiAXdCRdVSun5iM';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SellProps {
  mode: 'Buyer' | 'Seller';
}

export default function SellScreen({ mode }: SellProps) {
  // 🌟 從 useApp 中解構出 products 與 fetchProducts
  const { watchlist, products, setActiveAuctionItem, fetchProducts } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();

  // Seller 模式的表單狀態
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [duration, setDuration] = useState('60');
  const [loading, setLoading] = useState(false);

  // 彈出選擇選單：拍照 或 從相簿選擇
  const showImagePickerOptions = () => {
    Alert.alert(
      'Upload Product Image',
      'Choose a source',
      [
        { text: 'Take Photo', onPress: openCamera },
        { text: 'Choose from Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // 1. 開啟相機拍照
  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 2. 從相簿選擇圖片
  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Gallery access is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 🌟 將本地圖片上傳至 Supabase Storage，並回傳公開 HTTPS 網址
  const uploadImageToSupabase = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileName = `product_${Date.now()}.jpg`;
      const filePath = `public/${fileName}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg',
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image to Supabase:', error);
      throw error;
    }
  };

  // 1. Buyer 模式：從 Watchlist 選擇並進入拍賣室
  const handleStartAuction = () => {
    const selectedProduct = watchlist.find((item) => item.id === selectedId);

    if (!selectedProduct) {
      Alert.alert('Selection Required', 'Please select a product from your watchlist to start the auction.');
      return;
    }

    setActiveAuctionItem(selectedProduct);

    navigation.navigate('AuctionRoom', {
      auctionId: selectedProduct.id,
      title: selectedProduct.title,
    });
  };

  // 2. Seller 模式：提交商品至後端資料庫
  const handleCreateAuction = async () => {
    if (!title || !price || !description) {
      Alert.alert('Error', 'Please fill in all required fields (Title, Price, Description)');
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

      if (imageUri && !imageUri.startsWith('http')) {
        finalImageUrl = await uploadImageToSupabase(imageUri);
      } else if (imageUri) {
        finalImageUrl = imageUri;
      }

      const response = await fetch('http://192.168.0.226:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          price: parseFloat(price),
          description,
          category: category || 'General',
          image: finalImageUrl,
          duration: parseInt(duration),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create auction');
      }

      Alert.alert('Success', 'Your auction item has been published successfully!');
      
      setTitle('');
      setPrice('');
      setDescription('');
      setCategory('');
      setImageUri('');
      setDuration('60');

      await fetchProducts();

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Network error while creating auction');
    } finally {
      setLoading(false);
    }
  };

  // 🌟 3. 刪除商品的函數
  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this auction item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://192.168.0.226:5000/api/products/${productId}`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                throw new Error('Failed to delete product');
              }

              Alert.alert('Success', 'Product has been deleted.');
              await fetchProducts(); // 重新整理列表
            } catch (error: any) {
              console.error(error);
              Alert.alert('Error', error.message || 'Network error');
            }
          },
        },
      ]
    );
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

        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  // ==================== 如果是 Seller 模式 ====================
  if (mode === 'Seller') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Seller Dashboard</Text>
            <Text style={styles.headerSubtitle}>List & manage your auction items</Text>
          </View>
          <View style={styles.modeBadge}>
            <Text style={styles.modeText}>Seller Mode</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.formContainer}>
          <Text style={styles.label}>Product Image *</Text>
          <TouchableOpacity style={styles.imagePickerBox} onPress={showImagePickerOptions}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="camera-outline" size={36} color="#888" />
                <Text style={styles.placeholderText}>Tap to Take Photo or Pick from Gallery</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Item Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Vintage Rolex Watch"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Starting Price ($) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 100"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Watches, Electronics"
            value={category}
            onChangeText={setCategory}
          />

          <Text style={styles.label}>Auction Duration (Seconds)</Text>
          <TextInput
            style={styles.input}
            placeholder="60"
            keyboardType="numeric"
            value={duration}
            onChangeText={setDuration}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your item condition, history, etc."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleCreateAuction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Publish Auction</Text>
            )}
          </TouchableOpacity>

          {/* 🌟 4. 新增「我上傳的商品管理區塊」 */}
          <Text style={[styles.label, { marginTop: 20, fontSize: 16 }]}>Manage My Listed Items</Text>
          {products.length === 0 ? (
            <Text style={styles.emptyManageText}>No items published yet.</Text>
          ) : (
            products.map((item) => (
              <View key={item.id} style={styles.manageCard}>
                <Image source={{ uri: item.image }} style={styles.manageImage} />
                <View style={styles.manageDetails}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardPrice}>Price: ${item.price}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteProduct(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==================== 如果是 Buyer 模式 ====================
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Launch Auction</Text>
          <Text style={styles.headerSubtitle}>Select an item from Watchlist to start</Text>
        </View>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>Buyer Mode</Text>
        </View>
      </View>

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
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  imagePickerBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#eef1f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
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
  submitBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  disabledBtn: {
    backgroundColor: '#bdc3c7',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitBtnText: {
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
  // 🌟 新增管理清單的樣式
  manageCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  manageImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  manageDetails: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  deleteBtn: {
    backgroundColor: '#ff3b30',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyManageText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 5,
  },
});