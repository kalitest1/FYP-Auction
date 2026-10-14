import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp, ActivityNotice } from './context/AppContext';

interface ActivityProps {
  mode: 'Buyer' | 'Seller';
}

export default function ActivityScreen({ mode }: ActivityProps) {
  const { activities } = useApp();

  // 根據狀態渲染對應的圖示與配色
  const getStatusConfig = (status: ActivityNotice['status']) => {
    switch (status) {
      case 'SUCCESS':
        return {
          icon: 'checkmark-circle' as const,
          color: '#27ae60',
          bgColor: '#e8f8f0',
          label: 'Won',
        };
      case 'FAILED':
        return {
          icon: 'close-circle' as const,
          color: '#e74c3c',
          bgColor: '#fdeae8',
          label: 'Lost',
        };
      case 'OUTBID':
        return {
          icon: 'warning' as const,
          color: '#f39c12',
          bgColor: '#fef5e7',
          label: 'Outbid',
        };
      default:
        return {
          icon: 'notifications' as const,
          color: '#007AFF',
          bgColor: '#e8f0fe',
          label: 'Notice',
        };
    }
  };

  const renderItem = ({ item }: { item: ActivityNotice }) => {
    const config = getStatusConfig(item.status);

    return (
      <View style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon} size={28} color={config.color} />
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.productTitle} numberOfLines={1}>
              {item.productTitle}
            </Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>

          <Text style={styles.priceText}>
            Final Bid: <Text style={styles.priceHighlight}>${item.finalPrice}</Text>
          </Text>

          <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部 Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Notifications</Text>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>{mode} Mode</Text>
        </View>
      </View>

      {/* 活動通知列表 */}
      {activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={70} color="#ccc" />
          <Text style={styles.emptyTitle}>No Recent Activity</Text>
          <Text style={styles.emptySubtitle}>
            Your auction status, winning bids, and outbid alerts will show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
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
    fontSize: 20,
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
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  priceText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  priceHighlight: {
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  statusText: {
    fontSize: 11,
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