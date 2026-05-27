import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { Dispatch } from 'redux';
import { useDispatch, useSelector } from 'react-redux';

import { useMercure } from '../services/MercureContext';
import { authLogout, type AuthAction } from '../app/actions';
import {
  fetchCustomerBootstrap,
  fetchCustomerCategories,
  fetchCustomerOrders,
  fetchCustomerProducts,
  placeCustomerOrder,
  type CustomerCategory,
  type CustomerOrder,
  type CustomerOrderItem,
  type CustomerProduct,
  type CustomerProfile,
} from '../app/api/customer';
import { getAccessToken } from '../app/authRoleAccess';
import type { RootState } from '../app/reducers';
import { signOutGoogle } from '../services/googleSignIn';
import { OfflineLogo } from '../components';
import { COLORS, mobileScreenStyles, SWEETORIA, TYPOGRAPHY } from '../styles';

type ActiveTab = 'products' | 'cart' | 'orders' | 'profile';

type CartEntry = {
  productId: number;
  quantity: number;
};

type CartRow = CartEntry & {
  name: string;
  category: string;
  unitPrice: number;
  stock: number;
  subtotal: number;
  imageUrl?: string | null;
};

const TABS: ActiveTab[] = ['products', 'cart', 'orders', 'profile'];
const TAB_META: Record<ActiveTab, { label: string; icon: string }> = {
  products: { label: 'Products', icon: 'storefront-outline' },
  cart: { label: 'Cart', icon: 'cart-outline' },
  orders: { label: 'Orders', icon: 'clipboard-list-outline' },
  profile: { label: 'Profile', icon: 'account-circle-outline' },
};

const toNumber = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(toNumber(value));

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return 'unknown date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'unknown date';
  }

  return date.toLocaleString();
};

const getImageUri = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const uri = value.trim();
  return uri.length > 0 ? uri : null;
};

const normalizeCart = (cart: CartEntry[], products: CustomerProduct[]): CartEntry[] => {
  const productById = new Map<number, CustomerProduct>();
  for (const product of products) {
    productById.set(toNumber(product.id), product);
  }

  const nextCart: CartEntry[] = [];

  for (const item of cart) {
    const product = productById.get(item.productId);
    if (!product) {
      continue;
    }

    const stock = Math.max(0, toNumber(product.stock));
    const quantity = Math.max(0, Math.min(toNumber(item.quantity), stock));

    nextCart.push({
      productId: item.productId,
      quantity,
    });
  }

  const isSame =
    nextCart.length === cart.length &&
    nextCart.every(
      (item, index) =>
        item.productId === cart[index]?.productId && item.quantity === cart[index]?.quantity,
    );

  return isSame ? cart : nextCart;
};

const HomeScreen = () => {
  const dispatch = useDispatch<Dispatch<AuthAction>>();
  const authData = useSelector((state: RootState) => state.auth.data);

  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingProducts, setIsRefreshingProducts] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'COD' | 'GCash' | 'Maya' | 'Card'>('COD');
  const liveSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const token = getAccessToken(authData);

  const { subscribe } = useMercure();

  const syncProductsFromServer = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const [nextProducts, nextCategories] = await Promise.all([
        fetchCustomerProducts(token),
        fetchCustomerCategories(token),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
    } catch (error) {
      console.warn('[Live Sync] Failed to sync products from server:', error);
    }
  }, [token]);

  const scheduleLiveProductSync = useCallback(() => {
    if (liveSyncTimerRef.current) {
      clearTimeout(liveSyncTimerRef.current);
    }

    // Debounce to collapse bursts of backend events into one fetch.
    liveSyncTimerRef.current = setTimeout(() => {
      liveSyncTimerRef.current = null;
      syncProductsFromServer().catch(() => undefined);
    }, 350);
  }, [syncProductsFromServer]);

  useEffect(() => {
    const unsubscribeInventory = subscribe('inventory', (data: any) => {
      setProducts(currentProducts => {
        const action = String(data?.action ?? data?.event ?? '').toLowerCase();
        const isDelete =
          data?.deleted === true ||
          action === 'delete' ||
          action === 'deleted' ||
          action === 'remove' ||
          action === 'removed';
        const targetId = toNumber(data?.productId ?? data?.id);

        if (isDelete && targetId > 0) {
          return currentProducts.filter((p) => toNumber(p.id) !== targetId);
        }

        if (targetId <= 0) {
          return currentProducts;
        }

        const exists = currentProducts.some(p => toNumber(p.id) === targetId);
        if (exists) {
          return currentProducts.map(p => 
            toNumber(p.id) === targetId 
              ? { 
                  ...p, 
                  stock: data.stock, 
                  price: data.price,
                  ...(data.name ? { name: data.name } : {}),
                  ...(data.category ? { category: data.category } : {}),
                  ...(data.imageUrl ? { imageUrl: data.imageUrl } : {})
                } 
              : p
          );
        } else {
          return [...currentProducts, {
            id: targetId,
            name: data.name || 'New Product',
            price: data.price || 0,
            stock: data.stock || 0,
            category: data.category || 'Uncategorized',
            imageUrl: data.imageUrl || null,
            description: data.description || ''
          }];
        }
      });

      scheduleLiveProductSync();
    });

    const unsubscribeOrder = subscribe('order_status', (data: any) => {
      setOrders(currentOrders => currentOrders.map(o =>
        toNumber(o.id) === toNumber(data.orderId)
          ? { ...o, status: data.status, totalAmount: data.totalAmount }
          : o
      ));
    });

    const unsubscribeNotification = subscribe('notification', (data: any) => {
      if (data && data.message) {
        Alert.alert(data.title || 'New Notification', data.message);
      }
    });

    const unsubscribeMessage = subscribe('message', (data: any) => {
      console.log('[Mercure] Generic message received:', data);
      scheduleLiveProductSync();
      
      // If it looks like a new product entity (has id, name, price, stock)
      if (data && data.id !== undefined && data.name && data.price !== undefined) {
        setProducts(currentProducts => {
          const exists = currentProducts.some(p => toNumber(p.id) === toNumber(data.id));
          if (!exists) {
            return [...currentProducts, {
              id: data.id,
              name: data.name,
              price: data.price,
              stock: data.stock || 0,
              category: data.category || 'Uncategorized',
              imageUrl: data.imageUrl || null,
              description: data.description || ''
            }];
          }
          return currentProducts;
        });
      }
    });

    return () => {
      unsubscribeInventory();
      unsubscribeOrder();
      unsubscribeNotification();
      unsubscribeMessage();
    };
  }, [scheduleLiveProductSync, subscribe]);

  const handleLogout = useCallback(() => {
    signOutGoogle().catch(() => undefined);
    dispatch(authLogout());
    Alert.alert('Success', 'Logged out successfully');
  }, [dispatch]);

  const loadCustomerData = useCallback(async () => {
    if (!token) {
      // No token yet — silently skip. The navigation system will redirect
      // unauthenticated users to the login screen automatically.
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchCustomerBootstrap(token);
      setCategories(data.categories);
      setProducts(data.products);
      setOrders(data.orders);
      setProfile(data.me);
      setCustomerName(data.me?.name ?? data.me?.username ?? '');
      setCart((currentCart) => normalizeCart(currentCart, data.products));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load customer data.';
      Alert.alert('Load failed', message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCustomerData().catch(() => undefined);
  }, [loadCustomerData]);

  // Polling fallback: Auto-fetch products every 5 seconds silently
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const nextProducts = await fetchCustomerProducts(token);
        if (isMounted) {
          setProducts(nextProducts);
        }
      } catch {
        // Silently ignore polling errors so it doesn't interrupt the user
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [token]);

  useEffect(() => {
    return () => {
      if (liveSyncTimerRef.current) {
        clearTimeout(liveSyncTimerRef.current);
        liveSyncTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setCart((currentCart) => normalizeCart(currentCart, products));
  }, [products]);

  const categoryOptions = useMemo(() => {
    const names = categories
      .map((category) => (category.name ?? '').trim())
      .filter((name) => name.length > 0);

    return ['All', ...names];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === '' || (product.category ?? '').toLowerCase() === selectedCategory;
      const matchesSearch =
        term === '' ||
        (product.name ?? '').toLowerCase().includes(term) ||
        (product.description ?? '').toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);

  const productById = useMemo(() => {
    const map = new Map<number, CustomerProduct>();
    for (const product of products) {
      map.set(toNumber(product.id), product);
    }
    return map;
  }, [products]);

  const productByName = useMemo(() => {
    const map = new Map<string, CustomerProduct>();
    for (const product of products) {
      const key = (product.name ?? '').trim().toLowerCase();
      if (key.length > 0) {
        map.set(key, product);
      }
    }
    return map;
  }, [products]);

  const findProductForOrderItem = useCallback(
    (item: CustomerOrderItem): CustomerProduct | undefined => {
      const byId = toNumber(item.productId);
      if (byId > 0 && productById.has(byId)) {
        return productById.get(byId);
      }

      const nameKey = (item.name ?? '').trim().toLowerCase();
      if (nameKey.length > 0) {
        return productByName.get(nameKey);
      }

      return undefined;
    },
    [productById, productByName],
  );

  const cartRows = useMemo<CartRow[]>(() => {
    const rows: CartRow[] = [];

    for (const item of cart) {
      const product = productById.get(item.productId);
      if (!product) {
        continue;
      }

      const quantity = Math.max(0, toNumber(item.quantity));
      const unitPrice = toNumber(product.price);
      const stock = Math.max(0, toNumber(product.stock));

      rows.push({
        productId: item.productId,
        quantity,
        name: product.name ?? 'Untitled product',
        category: product.category ?? 'Uncategorized',
        unitPrice,
        stock,
        subtotal: unitPrice * quantity,
        imageUrl: getImageUri(product.imageUrl ?? product.image ?? null),
      });
    }

    return rows;
  }, [cart, productById]);

  const purchasableCartRows = useMemo(
    () => cartRows.filter((row) => toNumber(row.quantity) > 0),
    [cartRows],
  );

  const cartTotal = useMemo(
    () => purchasableCartRows.reduce((sum, row) => sum + toNumber(row.subtotal), 0),
    [purchasableCartRows],
  );
  const cartItemCount = useMemo(
    () => purchasableCartRows.reduce((sum, row) => sum + toNumber(row.quantity), 0),
    [purchasableCartRows],
  );
  const miniAvatarInitial = useMemo(() => {
    const profileName = (profile?.name ?? profile?.username ?? '').trim();
    if (profileName.length > 0) {
      return profileName.charAt(0).toUpperCase();
    }

    const authName = (authData?.user?.name ?? authData?.user?.username ?? authData?.username ?? 'U')
      .trim();
    return authName.length > 0 ? authName.charAt(0).toUpperCase() : 'U';
  }, [authData, profile]);

  const addToCart = (productId: number) => {
    const product = products.find((item) => toNumber(item.id) === productId);
    if (!product) {
      Alert.alert('Unavailable', 'This product is no longer available.');
      return;
    }

    const stock = Math.max(0, toNumber(product.stock));
    if (stock === 0) {
      Alert.alert('Out of stock', 'This product is currently out of stock.');
      return;
    }

    const existing = cart.find((item) => item.productId === productId);
    const currentQty = existing ? toNumber(existing.quantity) : 0;

    if (currentQty >= stock) {
      Alert.alert('Stock limit reached', `Only ${stock} item(s) available.`);
      return;
    }

    setCart((currentCart) => {
      const index = currentCart.findIndex((item) => item.productId === productId);
      if (index < 0) {
        return [...currentCart, { productId, quantity: 1 }];
      }

      const nextCart = [...currentCart];
      nextCart[index] = {
        ...nextCart[index],
        quantity: nextCart[index].quantity + 1,
      };
      return nextCart;
    });
  };

  const updateCartQuantity = (productId: number, nextQuantity: number) => {
    const quantity = Math.max(0, toNumber(nextQuantity));

    setCart((currentCart) => {
      const nextCart = currentCart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
            }
          : item,
      );

      return nextCart;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
  };

  const handleBuyNow = (productId: number) => {
    addToCart(productId);
    setActiveTab('cart');
  };

  const refreshProducts = async () => {
    if (!token || isRefreshingProducts) {
      return;
    }

    setIsRefreshingProducts(true);
    try {
      const nextProducts = await fetchCustomerProducts(token);
      setProducts(nextProducts);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to refresh products.';
      Alert.alert('Refresh failed', message);
    } finally {
      setIsRefreshingProducts(false);
    }
  };

  const handleCheckoutPress = () => {
    if (!token) {
      Alert.alert('Session expired', 'Please sign in again.');
      handleLogout();
      return;
    }

    if (purchasableCartRows.length === 0) {
      Alert.alert('Cart empty', 'Please add at least one product before checkout.');
      return;
    }

    const hasOverStockQuantity = cartRows.some((row) => toNumber(row.quantity) > toNumber(row.stock));
    if (hasOverStockQuantity) {
      Alert.alert('Adjust quantity', 'Some requested quantities are higher than available stock.');
      return;
    }

    if (!customerName.trim()) {
      Alert.alert('Validation Error', 'Please enter a customer name.');
      return;
    }

    setIsPaymentModalVisible(true);
  };

const placeOrder = async (paymentMethod: string) => {
  if (!token) {
    return;
  }
  try {
    const safeToken = token!;
    // Build items array from purchasable cart rows
    const items = purchasableCartRows.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    // Append payment method to phone field
    const phoneText = customerPhone.trim();
    const phoneWithMethod = phoneText ? `${phoneText} [${paymentMethod}]` : `[${paymentMethod}]`;

    const order = await placeCustomerOrder(safeToken, {
      customerName: customerName.trim(),
      customerPhone: phoneWithMethod,
      items,
    } as any);

    const [nextProducts, nextOrders] = await Promise.all([
      fetchCustomerProducts(safeToken),
      fetchCustomerOrders(safeToken),
    ]);
    setProducts(nextProducts);
    setOrders(nextOrders);
    setCart([]);
    setCustomerPhone('');
    setIsPaymentModalVisible(false);
    setActiveTab('orders');

    Alert.alert('Order placed', `Order #${order.id} placed successfully via ${paymentMethod}.`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to place order.';
    Alert.alert('Checkout failed', message);
  } finally {
    setIsPlacingOrder(false);
  }
};

  const renderProductsTab = () => (
    <View style={styles.section}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search products"
          placeholderTextColor={COLORS.gray}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            refreshProducts().catch(() => undefined);
          }}
          disabled={isRefreshingProducts || isLoading}
        >
          <Text style={styles.refreshButtonText}>
            {isRefreshingProducts ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {categoryOptions.map((category) => {
          const selected = (category === 'All' && selectedCategory === '') || selectedCategory === category.toLowerCase();

          return (
            <TouchableOpacity
              key={category}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => setSelectedCategory(category === 'All' ? '' : category.toLowerCase())}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{category}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No products matched your filters.</Text>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => {
            const productId = toNumber(product.id);
            const stock = Math.max(0, toNumber(product.stock));
            const imageUri = getImageUri(product.imageUrl ?? product.image ?? null);
            const hasImage = imageUri !== null;

            return (
              <View key={productId} style={styles.productCard}>
                <View style={styles.productImageWrap}>
                  {hasImage ? (
                    <Image
                      style={styles.productImage}
                      source={{ uri: imageUri ?? '' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <MaterialCommunityIcons name="image-off-outline" size={16} color={COLORS.gray} />
                      <Text style={styles.productImagePlaceholderText}>No Image</Text>
                    </View>
                  )}
                  <View style={[styles.stockBadge, stock === 0 && styles.stockBadgeDanger]}>
                    <MaterialCommunityIcons
                      name={stock === 0 ? 'close-circle-outline' : 'check-circle-outline'}
                      size={10}
                      color={stock === 0 ? '#842029' : '#0f5132'}
                    />
                    <Text style={[styles.stockBadgeText, stock === 0 && styles.stockBadgeTextDanger]}>
                      {stock === 0 ? 'Out' : stock}
                    </Text>
                  </View>
                </View>

                <View style={styles.productContent}>
                  <Text numberOfLines={2} style={styles.productName}>{product.name ?? 'Untitled product'}</Text>
                  <View style={styles.productMetaChip}>
                    <MaterialCommunityIcons name="tag-outline" size={10} color={COLORS.gray} />
                    <Text numberOfLines={1} style={styles.productMeta}>{product.category ?? 'Uncategorized'}</Text>
                  </View>
                  <Text style={styles.productPrice}>{formatCurrency(toNumber(product.price))}</Text>
                </View>

                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={[styles.addButton, stock === 0 && styles.addButtonDisabled]}
                    onPress={() => addToCart(productId)}
                    disabled={stock === 0 || isLoading}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buyButton, stock === 0 && styles.addButtonDisabled]}
                    onPress={() => handleBuyNow(productId)}
                    disabled={stock === 0 || isLoading}
                  >
                    <Text style={styles.buyButtonText}>Buy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderCartTab = () => (
    <View style={styles.section}>
      {cartRows.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Your cart is empty.</Text>
        </View>
      ) : (
        <>
          <View style={styles.checkoutFormRow}>
            <TextInput
              style={[styles.field, styles.checkoutField]}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer name"
              placeholderTextColor={COLORS.gray}
            />
            <TextInput
              style={[styles.field, styles.checkoutField]}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="Phone number (optional)"
              placeholderTextColor={COLORS.gray}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.cartList}>
            {cartRows.map((item) => {
              const isZeroQty = item.quantity === 0;
              const isOverStockQty = item.quantity > item.stock;

              return (
                <View key={item.productId} style={styles.cartListItem}>
                  <View style={styles.cartListTopRow}>
                    <View style={styles.cartCellProduct}>
                      {item.imageUrl ? (
                        <Image style={styles.cartProductImage} source={{ uri: item.imageUrl }} resizeMode="cover" />
                      ) : (
                        <View style={styles.cartProductImagePlaceholder}>
                          <MaterialCommunityIcons name="image-off-outline" size={18} color={COLORS.gray} />
                        </View>
                      )}
                      <View style={styles.cartCellProductTextWrap}>
                        <Text numberOfLines={1} style={styles.cartItemName}>{item.name}</Text>
                        <Text numberOfLines={1} style={styles.cartItemMeta}>{item.category}</Text>
                        <Text style={styles.stockInline}>Stock: {item.stock}</Text>
                        <Text style={styles.cartInlineSubtotal}>Subtotal (per item): {formatCurrency(item.unitPrice)}</Text>
                        <Text style={styles.cartInlineTotal}>Total: {formatCurrency(item.subtotal)}</Text>
                      </View>
                    </View>

                    <View style={styles.cartPriceBlock}>
                      <Text style={styles.cartTotalLabel}>Total</Text>
                      <Text style={styles.cartTotalValue}>{formatCurrency(item.subtotal)}</Text>
                    </View>
                  </View>

                  <View style={styles.cartListBottomRow}>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => updateCartQuantity(item.productId, item.quantity - 1)}
                      >
                        <Text style={styles.qtyButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.qtyValue,
                          isZeroQty && styles.qtyValueZero,
                          isOverStockQty && styles.qtyValueOver,
                        ]}
                      >
                        {item.quantity}
                      </Text>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => updateCartQuantity(item.productId, item.quantity + 1)}
                      >
                        <Text style={styles.qtyButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.removeItemButton} onPress={() => removeFromCart(item.productId)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#842029" />
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[
                      styles.qtyToBuyText,
                      isZeroQty && styles.qtyToBuyTextZero,
                      isOverStockQty && styles.qtyToBuyTextOver,
                    ]}
                  >
                    Qty to buy: {item.quantity}
                  </Text>
                  {isZeroQty ? (
                    <Text style={[styles.qtyHintText, styles.qtyHintTextZero]}>
                      Quantity is 0. Increase it to continue checkout.
                    </Text>
                  ) : null}
                  {isOverStockQty ? (
                    <Text style={[styles.qtyHintText, styles.qtyHintTextOver]}>
                      Requested quantity exceeds stock ({item.stock} available).
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );

  const renderCartBottomBar = () => {
    const hasOverStockQuantity = cartRows.some((row) => toNumber(row.quantity) > toNumber(row.stock));
    const canCheckout = purchasableCartRows.length > 0 && !isPlacingOrder && !hasOverStockQuantity;

    return (
      <View style={styles.cartBottomBar}>
        <View>
          <Text style={styles.cartBottomLabel}>Total</Text>
          <Text style={styles.cartBottomTotal}>{formatCurrency(cartTotal)}</Text>
          {hasOverStockQuantity ? (
            <Text style={styles.cartBottomWarningText}>
              Some quantities are above stock. Please reduce them.
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.cartBottomCheckoutButton, !canCheckout && styles.addButtonDisabled]}
          onPress={handleCheckoutPress}
          disabled={!canCheckout}
        >
          <Text style={styles.cartBottomCheckoutButtonText}>
            {isPlacingOrder ? 'Placing order...' : 'Buy now'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderOrdersTab = () => (
    <View style={styles.section}>
      {orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No orders yet.</Text>
        </View>
      ) : (
        orders.map((order) => {
          const leadProductName = order.items?.[0]?.name ?? `Order ${order.id}`;

          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.orderTitle}>Order: {leadProductName}</Text>
              </View>

              {(order.items ?? []).map((item, index) => {
                const linkedProduct = findProductForOrderItem(item);
                const imageUri = getImageUri(linkedProduct?.imageUrl ?? linkedProduct?.image ?? null);
                const category = linkedProduct?.category ?? 'Uncategorized';
                const liveStock = linkedProduct ? Math.max(0, toNumber(linkedProduct.stock)) : null;

                return (
                  <View key={`${order.id}-${index}`} style={styles.orderItemRow}>
                    {imageUri ? (
                      <Image style={styles.orderItemImage} source={{ uri: imageUri }} resizeMode="cover" />
                    ) : (
                      <View style={styles.orderItemImagePlaceholder}>
                        <MaterialCommunityIcons name="image-off-outline" size={16} color={COLORS.gray} />
                      </View>
                    )}

                    <View style={styles.orderItemBody}>
                      <Text style={styles.orderItemName}>{item.name}</Text>
                      <Text style={styles.orderItemAttr}>
                        Qty: {toNumber(item.quantity)} | Category: {category}
                      </Text>
                      <Text style={styles.orderItemAttr}>
                        Unit: {formatCurrency(toNumber(item.unitPrice))} | Subtotal: {formatCurrency(toNumber(item.subtotal))}
                      </Text>
                      {liveStock !== null ? (
                        <Text style={styles.orderItemAttr}>Current stock: {liveStock}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}

              <View style={[styles.rowBetween, styles.orderTotalRow]}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryTotal}>{formatCurrency(toNumber(order.totalAmount))}</Text>
              </View>
              {/* Delivery status */}
              {(() => {
                const paymentMethod = (() => {
                  const phoneStr = order.customerPhone ?? '';
                  if (phoneStr.includes('[') && phoneStr.includes(']')) {
                    const start = phoneStr.indexOf('[');
                    const end = phoneStr.indexOf(']');
                    return phoneStr.substring(start + 1, end);
                  }
                  return '';
                })();
                const deliveryText = paymentMethod === 'COD' ? 'On the way' : 'Delivered';
                const deliveryStyle = paymentMethod === 'COD' ? styles.deliveryOnTheWay : styles.deliveryDelivered;
                return <Text style={deliveryStyle}>Delivery: {deliveryText}</Text>;
              })()}
            </View>
          );
        })
      )}
    </View>
  );

  const renderProfileTab = () => (
    <View style={styles.section}>
      <View style={[mobileScreenStyles.card, styles.profileTikTokCard]}>
        <View style={styles.profileHeaderCenter}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {(profile?.name ?? profile?.username ?? 'U').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.profileNameLarge}>
            {(profile?.name ?? profile?.username ?? 'User').trim()}
          </Text>
          <Text style={styles.profileHandle}>@{(profile?.username ?? 'customer').trim()}</Text>
        </View>

        <View style={styles.profileStatsRow}>
          <View style={styles.profileStatBlock}>
            <Text style={styles.profileStatValue}>{orders.length}</Text>
            <Text style={styles.profileStatLabel}>Orders</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStatBlock}>
            <Text style={styles.profileStatValue}>{cartItemCount}</Text>
            <Text style={styles.profileStatLabel}>Cart Items</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStatBlock}>
            <Text style={styles.profileStatValue}>{profile?.isVerified ? 'Yes' : 'No'}</Text>
            <Text style={styles.profileStatLabel}>Verified</Text>
          </View>
        </View>

        <View style={styles.profileActionRow}>
          <TouchableOpacity style={styles.profilePrimaryButton} onPress={handleLogout}>
            <Text style={styles.profilePrimaryButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'products':
        return renderProductsTab();
      case 'cart':
        return renderCartTab();
      case 'orders':
        return renderOrdersTab();
      case 'profile':
        return renderProfileTab();
      default:
        return renderProductsTab();
    }
  };

  return (
    <View style={mobileScreenStyles.screen}>
      <View style={mobileScreenStyles.topBar}>
        <View style={styles.headerRow}>
          <View style={styles.logoWrap}>
            <OfflineLogo size={76} />
          </View>
          <TouchableOpacity
            style={styles.miniAvatarButton}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.85}
          >
            <View style={styles.miniAvatarCylinder}>
              <View style={styles.miniAvatarCore}>
                <Text style={styles.miniAvatarInitial}>{miniAvatarInitial}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          styles.contentContainerWithBottomNav,
          activeTab === 'cart' && styles.contentContainerWithCartBottomStack,
        ]}
      >
        {isLoading && products.length === 0 && orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Loading customer data...</Text>
          </View>
        ) : (
          renderActiveTab()
        )}
      </ScrollView>

      {activeTab === 'cart' && renderCartBottomBar()}

      <View style={styles.bottomTabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab;
          const label =
            tab === 'cart' && cartItemCount > 0 ? `Cart (${cartItemCount})` : TAB_META[tab].label;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, active && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <View style={styles.tabButtonInner}>
                <MaterialCommunityIcons
                  name={TAB_META[tab].icon}
                  size={17}
                  color={active ? COLORS.primaryDark : '#694f41'}
                />
                <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Payment Selection Modal */}
      <Modal
        visible={isPaymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setIsPaymentModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={20} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Choose how you want to pay for your order:</Text>

            <View style={styles.paymentOptionsList}>
              {/* Cash on Delivery (COD) */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionItem,
                  selectedPaymentMethod === 'COD' && styles.paymentOptionItemSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('COD')}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconWrap, { backgroundColor: '#e2f0d9' }]}>
                    <MaterialCommunityIcons name="cash" size={22} color="#385723" />
                  </View>
                  <Text style={styles.paymentOptionName}>Cash on Delivery (COD)</Text>
                </View>
                <View style={styles.paymentOptionRight}>
                  {selectedPaymentMethod === 'COD' && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.authCoral} />
                  )}
                </View>
              </TouchableOpacity>

              {/* GCash */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionItem,
                  selectedPaymentMethod === 'GCash' && styles.paymentOptionItemSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('GCash')}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconWrap, { backgroundColor: '#cfe2ff' }]}>
                    <MaterialCommunityIcons name="wallet" size={22} color="#0d6efd" />
                  </View>
                  <Text style={styles.paymentOptionName}>GCash</Text>
                </View>
                <View style={styles.paymentOptionRight}>
                  {selectedPaymentMethod === 'GCash' && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.authCoral} />
                  )}
                </View>
              </TouchableOpacity>

              {/* PayMaya */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionItem,
                  selectedPaymentMethod === 'Maya' && styles.paymentOptionItemSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('Maya')}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconWrap, { backgroundColor: '#f8d7da' }]}>
                    <MaterialCommunityIcons name="credit-card-outline" size={22} color="#b02a37" />
                  </View>
                  <Text style={styles.paymentOptionName}>Maya</Text>
                </View>
                <View style={styles.paymentOptionRight}>
                  {selectedPaymentMethod === 'Maya' && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.authCoral} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Credit/Debit Card */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionItem,
                  selectedPaymentMethod === 'Card' && styles.paymentOptionItemSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('Card')}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconWrap, { backgroundColor: '#e2d9f3' }]}>
                    <MaterialCommunityIcons name="card-outline" size={22} color="#593196" />
                  </View>
                  <Text style={styles.paymentOptionName}>Credit / Debit Card</Text>
                </View>
                <View style={styles.paymentOptionRight}>
                  {selectedPaymentMethod === 'Card' && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.authCoral} />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSummary}>
              <Text style={styles.modalSummaryLabel}>Total Amount:</Text>
              <Text style={styles.modalSummaryValue}>{formatCurrency(cartTotal)}</Text>
            </View>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsPaymentModalVisible(false)}
                disabled={isPlacingOrder}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, isPlacingOrder && styles.addButtonDisabled]}
                onPress={() => {
                  placeOrder(selectedPaymentMethod).catch(() => undefined);
                }}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Confirm & Pay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SWEETORIA.spacing.sm,
    minHeight: 56,
  },
  logoWrap: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  miniAvatarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  miniAvatarCylinder: {
    width: 40,
    height: 50,
    borderRadius: 20,
    backgroundColor: '#fffaf5',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    shadowColor: '#4f3828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  miniAvatarCore: {
    width: 24,
    height: 24,
    marginTop: 8,
    borderRadius: SWEETORIA.radius.pill,
    backgroundColor: '#f1dac4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarInitial: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontWeight: '800',
    fontSize: 11,
  },
  connectionRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  connectionTextOk: {
    color: '#0f5132',
  },
  connectionTextBad: {
    color: '#842029',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#efdfd3',
    borderRadius: SWEETORIA.radius.pill,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SWEETORIA.spacing.md,
  },
  contentContainerWithBottomNav: {
    paddingBottom: 96,
  },
  contentContainerWithCartBottomStack: {
    paddingBottom: 176,
  },
  section: {
    gap: SWEETORIA.spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    gap: SWEETORIA.spacing.sm,
    marginBottom: SWEETORIA.spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e7d8c6',
    borderRadius: SWEETORIA.radius.sm,
    paddingHorizontal: 11,
    paddingVertical: 10,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SWEETORIA.radius.sm,
    backgroundColor: '#f5ece2',
    justifyContent: 'center',
    paddingHorizontal: SWEETORIA.spacing.md,
  },
  refreshButtonText: {
    ...TYPOGRAPHY.caption,
    color: '#5f4b3e',
    fontWeight: '600',
  },
  chipsRow: {
    gap: SWEETORIA.spacing.sm,
    paddingBottom: SWEETORIA.spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#e8d8cb',
    backgroundColor: COLORS.chip,
    borderRadius: SWEETORIA.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: '#6d4d3b',
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.white,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SWEETORIA.spacing.sm,
  },
  productCard: {
    width: '31.5%',
    borderWidth: 1,
    borderColor: '#e4d4c5',
    borderRadius: SWEETORIA.radius.lg,
    padding: SWEETORIA.spacing.xs,
    backgroundColor: COLORS.white,
    gap: 6,
    shadowColor: '#4f3828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  productImageWrap: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 78,
    borderRadius: SWEETORIA.radius.sm,
    backgroundColor: '#f7efe8',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 78,
    borderRadius: SWEETORIA.radius.sm,
    borderWidth: 1,
    borderColor: '#e6d7ca',
    backgroundColor: '#f4ece2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  stockBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#d1e7dd',
    borderColor: '#badbcc',
    borderWidth: 1,
    borderRadius: SWEETORIA.radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockBadgeDanger: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c2c7',
  },
  stockBadgeText: {
    ...TYPOGRAPHY.caption,
    color: '#0f5132',
    fontWeight: '700',
    fontSize: 9,
  },
  stockBadgeTextDanger: {
    color: '#842029',
  },
  productImagePlaceholderText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    textAlign: 'center',
    fontSize: 9,
  },
  productContent: {
    flex: 1,
    gap: 4,
  },
  productName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.black,
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 13,
  },
  productMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  productMetaChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e7d8c8',
    borderRadius: SWEETORIA.radius.pill,
    backgroundColor: '#fff9f2',
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productPrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 11,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SWEETORIA.radius.sm,
    paddingHorizontal: 0,
    paddingVertical: 6,
    flex: 1,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 5,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  addButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 10,
  },
  buyButton: {
    backgroundColor: '#f5ece2',
    borderRadius: SWEETORIA.radius.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: 0,
    paddingVertical: 6,
    flex: 1,
  },
  buyButtonText: {
    ...TYPOGRAPHY.caption,
    color: '#5f4b3e',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 10,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: '#dfd1c2',
    borderStyle: 'dashed',
    borderRadius: SWEETORIA.radius.md,
    backgroundColor: COLORS.cream,
    padding: SWEETORIA.spacing.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray,
    textAlign: 'center',
  },
  cartTable: {
    borderWidth: 1,
    borderColor: '#e6d8ca',
    borderRadius: SWEETORIA.radius.md,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    minWidth: 720,
  },
  cartTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0e6da',
    alignItems: 'center',
    minHeight: 74,
  },
  cartTableHeaderRow: {
    minHeight: 46,
    backgroundColor: '#f9efe5',
  },
  cartTableHeaderCell: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontWeight: '700',
    paddingHorizontal: SWEETORIA.spacing.sm,
  },
  cartTableCell: {
    paddingHorizontal: SWEETORIA.spacing.sm,
    paddingVertical: SWEETORIA.spacing.xs,
    justifyContent: 'center',
  },
  cartColProduct: {
    width: 260,
  },
  cartColPrice: {
    width: 115,
  },
  cartColQty: {
    width: 150,
  },
  cartColSubtotal: {
    width: 130,
  },
  cartColAction: {
    width: 80,
    alignItems: 'center',
  },
  cartCellProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SWEETORIA.spacing.sm,
  },
  cartCellProductTextWrap: {
    flex: 1,
    gap: 1,
  },
  cartProductImage: {
    width: 58,
    height: 58,
    borderRadius: SWEETORIA.radius.sm,
    borderWidth: 1,
    borderColor: '#e6d7ca',
    backgroundColor: '#f4ece2',
  },
  cartProductImagePlaceholder: {
    width: 58,
    height: 58,
    borderRadius: SWEETORIA.radius.sm,
    borderWidth: 1,
    borderColor: '#e6d7ca',
    backgroundColor: '#f4ece2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SWEETORIA.spacing.sm,
  },
  cartItemName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.black,
    fontWeight: '700',
    flex: 1,
  },
  cartItemMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    flex: 1,
  },
  cartInlineSubtotal: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontWeight: '700',
    marginTop: 2,
  },
  cartInlineTotal: {
    ...TYPOGRAPHY.caption,
    color: COLORS.black,
    fontWeight: '700',
    marginTop: 1,
  },
  stockInline: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    fontWeight: '600',
    fontSize: 11,
  },
  cartItemPrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.black,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SWEETORIA.spacing.sm,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4d7c8',
    backgroundColor: '#fffaf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#664c3d',
    fontWeight: '700',
  },
  qtyValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.black,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  qtyValueZero: {
    color: '#c62828',
  },
  qtyValueOver: {
    color: '#e65100',
  },
  qtyToBuyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: 4,
  },
  qtyToBuyTextZero: {
    color: '#c62828',
    fontWeight: '700',
  },
  qtyToBuyTextOver: {
    color: '#e65100',
    fontWeight: '700',
  },
  qtyHintText: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
    color: COLORS.gray,
  },
  qtyHintTextZero: {
    color: '#c62828',
    fontWeight: '700',
  },
  qtyHintTextOver: {
    color: '#e65100',
    fontWeight: '700',
  },
  removeItemButton: {
    width: 32,
    height: 32,
    borderRadius: SWEETORIA.radius.sm,
    borderWidth: 1,
    borderColor: '#f5c2c7',
    backgroundColor: '#f8d7da',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutFormRow: {
    marginBottom: SWEETORIA.spacing.sm,
    gap: SWEETORIA.spacing.xs,
  },
  checkoutField: {
    width: '100%',
  },
  cartList: {
    gap: SWEETORIA.spacing.sm,
  },
  cartListItem: {
    borderWidth: 1,
    borderColor: '#e6d8ca',
    borderRadius: SWEETORIA.radius.md,
    backgroundColor: COLORS.white,
    padding: SWEETORIA.spacing.sm,
    gap: SWEETORIA.spacing.xs,
  },
  cartListTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SWEETORIA.spacing.sm,
  },
  cartPriceBlock: {
    minWidth: 110,
    alignItems: 'flex-end',
    gap: 1,
  },
  cartUnitLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  cartSubtotalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: 4,
  },
  cartMathText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: 1,
  },
  cartSubtotalValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  cartTotalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: 4,
  },
  cartTotalValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  cartListBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SWEETORIA.spacing.sm,
  },
  cartBottomBar: {
    borderTopWidth: 1,
    borderTopColor: '#dbcbb8',
    backgroundColor: COLORS.white,
    minHeight: 74,
    paddingHorizontal: SWEETORIA.spacing.md,
    paddingVertical: SWEETORIA.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartBottomLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    fontWeight: '600',
  },
  cartBottomTotal: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
  },
  cartBottomWarningText: {
    ...TYPOGRAPHY.caption,
    color: '#e65100',
    marginTop: 2,
    maxWidth: 220,
  },
  cartBottomCheckoutButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SWEETORIA.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 150,
    paddingHorizontal: SWEETORIA.spacing.lg,
    paddingVertical: SWEETORIA.spacing.sm,
  },
  cartBottomCheckoutButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    fontWeight: '700',
  },
  summaryLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.black,
    fontWeight: '700',
  },
  summaryTotal: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
  },
  field: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SWEETORIA.radius.sm,
    paddingHorizontal: 11,
    paddingVertical: 10,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SWEETORIA.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: SWEETORIA.spacing.lg,
    paddingVertical: SWEETORIA.spacing.sm,
  },
  checkoutButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    fontWeight: '700',
  },
  mutedNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    lineHeight: 18,
  },
  orderCard: {
    borderWidth: 1,
    borderColor: '#ece2d3',
    borderRadius: SWEETORIA.radius.md,
    padding: SWEETORIA.spacing.sm,
    backgroundColor: COLORS.white,
    gap: SWEETORIA.spacing.xs,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SWEETORIA.spacing.sm,
    borderWidth: 1,
    borderColor: '#efe3d6',
    borderRadius: SWEETORIA.radius.sm,
    backgroundColor: '#fffaf5',
    padding: SWEETORIA.spacing.xs,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: SWEETORIA.radius.sm,
    borderWidth: 1,
    borderColor: '#e6d7ca',
    backgroundColor: '#f4ece2',
  },
  orderItemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: SWEETORIA.radius.sm,
    borderWidth: 1,
    borderColor: '#e6d7ca',
    backgroundColor: '#f4ece2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderItemBody: {
    flex: 1,
    gap: 1,
  },
  orderItemName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.black,
    fontWeight: '700',
  },
  orderItemAttr: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  orderTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.black,
    fontWeight: '700',
  },
  orderStatus: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  orderDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SWEETORIA.spacing.xs,
  },
  orderItemText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  orderTotalRow: {
    marginTop: SWEETORIA.spacing.sm,
    paddingTop: SWEETORIA.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#dbcbb8',
  },
  profileTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
    marginBottom: SWEETORIA.spacing.sm,
  },
  profileTikTokCard: {
    paddingVertical: SWEETORIA.spacing.lg,
    gap: SWEETORIA.spacing.md,
  },
  profileHeaderCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  avatarCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#f4e4d8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...TYPOGRAPHY.h1,
    color: '#111111',
    fontWeight: '700',
  },
  profileNameLarge: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileHandle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    fontWeight: '600',
  },
  profileStatsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ede2d7',
    borderRadius: SWEETORIA.radius.md,
    backgroundColor: '#fffaf5',
    overflow: 'hidden',
  },
  profileStatBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SWEETORIA.spacing.sm,
    gap: 2,
  },
  profileStatDivider: {
    width: 1,
    backgroundColor: '#efe3d6',
  },
  profileStatValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.black,
    fontWeight: '700',
  },
  profileStatLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  profileActionRow: {
    alignItems: 'center',
  },
  profilePrimaryButton: {
    minWidth: 180,
    minHeight: 42,
    borderRadius: SWEETORIA.radius.sm,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SWEETORIA.spacing.lg,
  },
  profilePrimaryButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#ffffff',
    fontWeight: '700',
  },
  profileLine: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray,
    marginBottom: SWEETORIA.spacing.xs,
  },
  profileValue: {
    color: COLORS.black,
    fontWeight: '600',
  },
  bottomTabBar: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    paddingTop: SWEETORIA.spacing.xs,
    paddingBottom: SWEETORIA.spacing.xs,
    paddingHorizontal: SWEETORIA.spacing.xs,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    borderRadius: SWEETORIA.radius.sm,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabButtonActive: {
    backgroundColor: '#f4e4d8',
  },
  tabButtonText: {
    ...TYPOGRAPHY.caption,
    color: '#694f41',
    fontSize: 12,
  },
  tabButtonTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SWEETORIA.radius.lg,
    borderTopRightRadius: SWEETORIA.radius.lg,
    padding: SWEETORIA.spacing.md,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SWEETORIA.spacing.xs,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SWEETORIA.spacing.md,
  },
  paymentOptionsList: {
    gap: SWEETORIA.spacing.sm,
    marginBottom: SWEETORIA.spacing.md,
  },
  paymentOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SWEETORIA.spacing.sm,
    borderWidth: 1,
    borderColor: '#e6d8ca',
    borderRadius: SWEETORIA.radius.md,
    backgroundColor: '#fffaf5',
  },
  paymentOptionItemSelected: {
    borderColor: COLORS.authCoral,
    backgroundColor: '#fdf4f0',
    borderWidth: 2,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SWEETORIA.spacing.sm,
  },
  paymentIconWrap: {
    width: 38,
    height: 38,
    borderRadius: SWEETORIA.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentOptionName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.black,
    fontWeight: '600',
  },
  paymentOptionRight: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SWEETORIA.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#efe3d6',
    borderBottomWidth: 1,
    borderBottomColor: '#efe3d6',
    marginBottom: SWEETORIA.spacing.md,
  },
  modalSummaryLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray,
    fontWeight: '600',
  },
  modalSummaryValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: SWEETORIA.spacing.sm,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dbcbb8',
    borderRadius: SWEETORIA.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  modalCancelButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#694f41',
    fontWeight: '700',
  },
  modalConfirmButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: SWEETORIA.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  modalConfirmButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default HomeScreen;

