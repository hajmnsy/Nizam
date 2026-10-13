/**
 * Offline storage and synchronization manager for Al-Jawda Steel POS.
 * Handles local caching of catalog data and queuing of offline invoices,
 * with automatic background synchronization when internet is restored.
 */

export interface QueuedOfflineSale {
    localId: string;
    createdAt: string;
    payload: any;
    itemsCount: number;
    customer: string;
    total: number;
    syncStatus: 'PENDING' | 'SYNCING' | 'ERROR';
    syncError?: string;
}

const STORAGE_KEYS = {
    PRODUCTS: 'jawda_offline_products',
    CATEGORIES: 'jawda_offline_categories',
    CUSTOMERS: 'jawda_offline_customers',
    BRANCHES: 'jawda_offline_branches',
    EXCHANGE_RATE: 'jawda_offline_exchange_rate',
    SALES_QUEUE: 'jawda_offline_sales_queue',
    LAST_SYNC: 'jawda_offline_last_sync'
};

// Safe localStorage access helper
function safeGetItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error('Error reading from localStorage', e);
        return null;
    }
}

function safeSetItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error('Error writing to localStorage', e);
    }
}

// Catalog Caching
export function cacheCatalogData(data: {
    products?: any[];
    categories?: any[];
    customers?: any[];
    branches?: any[];
    exchangeRate?: number;
}) {
    if (data.products && Array.isArray(data.products)) {
        safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
    }
    if (data.categories && Array.isArray(data.categories)) {
        safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
    }
    if (data.customers && Array.isArray(data.customers)) {
        safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
    }
    if (data.branches && Array.isArray(data.branches)) {
        safeSetItem(STORAGE_KEYS.BRANCHES, JSON.stringify(data.branches));
    }
    if (data.exchangeRate !== undefined) {
        safeSetItem(STORAGE_KEYS.EXCHANGE_RATE, String(data.exchangeRate));
    }
}

export function getCachedCatalog() {
    let products: any[] = [];
    let categories: any[] = [];
    let customers: any[] = [];
    let branches: any[] = [];
    let exchangeRate: number = 0;

    try {
        const prodRaw = safeGetItem(STORAGE_KEYS.PRODUCTS);
        if (prodRaw) products = JSON.parse(prodRaw);

        const catRaw = safeGetItem(STORAGE_KEYS.CATEGORIES);
        if (catRaw) categories = JSON.parse(catRaw);

        const custRaw = safeGetItem(STORAGE_KEYS.CUSTOMERS);
        if (custRaw) customers = JSON.parse(custRaw);

        const branchRaw = safeGetItem(STORAGE_KEYS.BRANCHES);
        if (branchRaw) branches = JSON.parse(branchRaw);

        const rateRaw = safeGetItem(STORAGE_KEYS.EXCHANGE_RATE);
        if (rateRaw) exchangeRate = parseFloat(rateRaw) || 0;
    } catch (e) {
        console.error('Error parsing cached catalog', e);
    }

    return { products, categories, customers, branches, exchangeRate };
}

// Queue Management
export function getOfflineSalesQueue(): QueuedOfflineSale[] {
    const raw = safeGetItem(STORAGE_KEYS.SALES_QUEUE);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

export function saveOfflineSalesQueue(queue: QueuedOfflineSale[]): void {
    safeSetItem(STORAGE_KEYS.SALES_QUEUE, JSON.stringify(queue));
    if (typeof window !== 'undefined') {
        // Dispatch custom event for reactive UI updates across components
        window.dispatchEvent(new CustomEvent('jawda_offline_queue_updated', { detail: { count: queue.length } }));
    }
}

export function enqueueOfflineSale(salePayload: any): QueuedOfflineSale {
    const currentQueue = getOfflineSalesQueue();
    const localId = `OFFLINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const queuedSale: QueuedOfflineSale = {
        localId,
        createdAt: salePayload.createdAt || new Date().toISOString(),
        payload: salePayload,
        itemsCount: (salePayload.items || []).reduce((sum: number, it: any) => sum + (parseInt(it.quantity) || 1), 0),
        customer: salePayload.customer || 'عميل نقدي',
        total: salePayload.items?.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0) - (salePayload.discount || 0) || 0,
        syncStatus: 'PENDING'
    };

    currentQueue.push(queuedSale);
    saveOfflineSalesQueue(currentQueue);

    // Locally deduct product quantities in the cached catalog
    try {
        const { products } = getCachedCatalog();
        if (products && products.length > 0 && Array.isArray(salePayload.items)) {
            const updatedProducts = products.map((prod: any) => {
                const soldItem = salePayload.items.find((it: any) => parseInt(it.productId) === prod.id);
                if (soldItem) {
                    return {
                        ...prod,
                        quantity: Math.max(0, (prod.quantity || 0) - parseInt(soldItem.quantity || '0'))
                    };
                }
                return prod;
            });
            safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
        }
    } catch (e) {
        console.error('Error updating cached product stock', e);
    }

    return queuedSale;
}

export function removeOfflineSale(localId: string): void {
    const currentQueue = getOfflineSalesQueue();
    const filtered = currentQueue.filter(s => s.localId !== localId);
    saveOfflineSalesQueue(filtered);
}

// Synchronization Runner
let isSyncInProgress = false;

export async function syncOfflineSales(): Promise<{ synced: number; failed: number; errors: string[] }> {
    if (isSyncInProgress) {
        return { synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    const queue = getOfflineSalesQueue();
    if (queue.length === 0) {
        return { synced: 0, failed: 0, errors: [] };
    }

    // Check if network is truly responsive
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { synced: 0, failed: queue.length, errors: ['Network offline'] };
    }

    isSyncInProgress = true;
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];
    const remainingQueue: QueuedOfflineSale[] = [];

    // Notify UI that sync has started
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jawda_offline_sync_status', { detail: { status: 'SYNCING', pendingCount: queue.length } }));
    }

    for (const item of queue) {
        try {
            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.payload)
            });

            if (response.ok) {
                synced++;
            } else {
                const errData = await response.json().catch(() => ({}));
                failed++;
                const errMsg = errData.details || errData.error || `HTTP ${response.status}`;
                errors.push(`الفاتورة (${item.customer}): ${errMsg}`);
                remainingQueue.push({
                    ...item,
                    syncStatus: 'ERROR',
                    syncError: errMsg
                });
            }
        } catch (netErr: any) {
            // Network dropped mid-sync
            failed++;
            errors.push(`انقطع الاتصال أثناء رفع الفاتورة (${item.customer})`);
            remainingQueue.push(item);
            // Stop syncing remaining items if network dropped
            break;
        }
    }

    saveOfflineSalesQueue(remainingQueue);
    safeSetItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    isSyncInProgress = false;

    // Notify UI of sync completion
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jawda_offline_sync_status', {
            detail: {
                status: 'DONE',
                synced,
                failed,
                remainingCount: remainingQueue.length,
                errors
            }
        }));
    }

    return { synced, failed, errors };
}
