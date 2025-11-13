// screens/StartupDashboardScreen.js - VERSION FINALE AVEC PAIEMENTS
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import paymentService from '../utils/paymentService';

const { width } = Dimensions.get('window');

export default function StartupDashboardScreen({ route, navigation }) {