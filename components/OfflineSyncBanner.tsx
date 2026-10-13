'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertTriangle, UploadCloud, Clock, X, FileText } from 'lucide-react'
import { getOfflineSalesQueue, syncOfflineSales, QueuedOfflineSale, removeOfflineSale } from '@/lib/offlineStorage'

export default function OfflineSyncBanner() {
    const [isOnline, setIsOnline] = useState<boolean>(true)
    const [queue, setQueue] = useState<QueuedOfflineSale[]>([])
    const [isSyncing, setIsSyncing] = useState<boolean>(false)
    const [showDrawer, setShowDrawer] = useState<boolean>(false)
    const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    // Load initial queue
    const updateQueueState = useCallback(() => {
        setQueue(getOfflineSalesQueue())
    }, [])

    const triggerSync = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return
        setIsSyncing(true)
        try {
            const res = await syncOfflineSales()
            if (res.synced > 0) {
                setSyncToast({
                    message: `تم بنجاح رفع وتحديث ${res.synced} فاتورة كانت معلقة في وضع الأوفلاين!`,
                    type: 'success'
                })
                setTimeout(() => setSyncToast(null), 6000)
            } else if (res.failed > 0 && res.errors.length > 0) {
                setSyncToast({
                    message: `فشل رفع بعض الفواتير: ${res.errors[0]}`,
                    type: 'error'
                })
                setTimeout(() => setSyncToast(null), 6000)
            }
        } catch (e) {
            console.error('Sync error:', e)
        } finally {
            setIsSyncing(false)
            updateQueueState()
        }
    }, [isSyncing, updateQueueState])

    useEffect(() => {
        // Initial online state
        setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
        updateQueueState()

        const handleOnline = () => {
            setIsOnline(true)
            // Auto-sync as soon as connection is back!
            triggerSync()
        }

        const handleOffline = () => {
            setIsOnline(false)
        }

        const handleQueueUpdate = () => {
            updateQueueState()
        }

        const handleSyncStatus = (e: any) => {
            if (e.detail?.status === 'SYNCING') {
                setIsSyncing(true)
            } else if (e.detail?.status === 'DONE') {
                setIsSyncing(false)
                updateQueueState()
            }
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        window.addEventListener('jawda_offline_queue_updated', handleQueueUpdate)
        window.addEventListener('jawda_offline_sync_status', handleSyncStatus)

        // Periodic connectivity ping & sync check every 25 seconds
        const interval = setInterval(async () => {
            if (typeof navigator !== 'undefined') {
                const online = navigator.onLine
                setIsOnline(online)
                if (online) {
                    const currentQ = getOfflineSalesQueue()
                    if (currentQ.length > 0 && !isSyncing) {
                        triggerSync()
                    }
                }
            }
        }, 25000)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
            window.removeEventListener('jawda_offline_queue_updated', handleQueueUpdate)
            window.removeEventListener('jawda_offline_sync_status', handleSyncStatus)
            clearInterval(interval)
        }
    }, [triggerSync, updateQueueState, isSyncing])

    const pendingCount = queue.length

    return (
        <>
            {/* Sync Success / Error Notification Toast */}
            {syncToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-full px-4 animate-bounce">
                    <div className={`p-4 rounded-xl shadow-2xl border flex items-center justify-between text-xs sm:text-sm font-black ${
                        syncToast.type === 'success'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/30'
                            : 'bg-rose-600 text-white border-rose-500 shadow-rose-500/30'
                    }`}>
                        <div className="flex items-center gap-2">
                            {syncToast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                            <span>{syncToast.message}</span>
                        </div>
                        <button onClick={() => setSyncToast(null)} className="text-white/80 hover:text-white p-1">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Offline Alert Strip (Visible when internet is lost) */}
            {!isOnline && (
                <div className="bg-amber-500 text-slate-950 font-bold px-3 py-1.5 text-xs text-center flex items-center justify-center gap-2 shadow-inner print:hidden">
                    <WifiOff size={15} className="animate-pulse text-amber-950" />
                    <span>
                        أنت تعمل الآن في <strong className="underline">وضع عدم الاتصال (أوفلاين)</strong>. يمكنك إصدار الفواتير محلياً بأمان، وسيتم مزامنتها تلقائياً مع الخادم فور عودة الإنترنت.
                    </span>
                    {pendingCount > 0 && (
                        <span className="bg-amber-950 text-amber-200 px-2 py-0.5 rounded-full text-[10px] font-mono">
                            {pendingCount} فواتير محفوظة محلياً
                        </span>
                    )}
                </div>
            )}

            {/* Offline Queue Floating Trigger Pill (Visible if there are pending offline invoices) */}
            {pendingCount > 0 && (
                <div className="fixed bottom-4 left-4 z-50 print:hidden animate-slide-up">
                    <button
                        onClick={() => setShowDrawer(true)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-xl font-black text-xs transition-all border ${
                            isOnline 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400 shadow-blue-500/30' 
                                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 shadow-amber-500/30'
                        }`}
                        title="عرض الفواتير المعلقة المحفوظة بدون إنترنت"
                    >
                        {isSyncing ? (
                            <RefreshCw size={15} className="animate-spin text-white" />
                        ) : isOnline ? (
                            <UploadCloud size={15} />
                        ) : (
                            <WifiOff size={15} />
                        )}
                        <span>
                            {isSyncing ? 'جاري المزامنة...' : `فواتير أوفلاين معلقة (${pendingCount})`}
                        </span>
                        {isOnline && !isSyncing && (
                            <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                مزامنة الآن
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Pending Offline Invoices Drawer / Modal */}
            {showDrawer && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:hidden animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                                    <UploadCloud size={18} className="text-blue-600" />
                                    صندوق الفواتير المحفوظة بدون إنترنت (أوفلاين)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    فواتير تم إنشاؤها أثناء انقطاع النت وتنتظر الرفع لقاعدة البيانات الرئيسية
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDrawer(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="p-4 flex-1 overflow-y-auto space-y-3">
                            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 font-bold">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                    <span>حالة الاتصال: {isOnline ? 'متصل بالإنترنت' : 'غير متصل (أوفلاين)'}</span>
                                </div>
                                <span className="font-mono">العدد: {pendingCount}</span>
                            </div>

                            {queue.map((item, idx) => (
                                <div key={item.localId || idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white transition-all flex flex-col gap-1.5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-mono font-bold text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                {item.localId}
                                            </span>
                                            <h4 className="font-black text-slate-900 text-sm mt-1">{item.customer}</h4>
                                        </div>
                                        <div className="text-left font-mono font-black text-slate-900 text-sm">
                                            {item.total.toLocaleString()} <span className="text-xs font-sans text-slate-400">ج.س</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60 font-bold">
                                        <span className="flex items-center gap-1 text-[11px]">
                                            <Clock size={12} />
                                            {new Date(item.createdAt).toLocaleTimeString('ar-SD')}
                                            <span className="text-slate-400">({item.itemsCount} أصناف)</span>
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {item.syncError && (
                                                <span className="text-rose-600 text-[10px]" title={item.syncError}>
                                                    خطأ في الرفع
                                                </span>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (confirm('هل أنت متأكد من حذف هذه الفاتورة من قائمة الانتظار المحلية؟')) {
                                                        removeOfflineSale(item.localId)
                                                        updateQueueState()
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 text-[11px] underline"
                                            >
                                                حذف
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                            <button
                                onClick={() => setShowDrawer(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                            >
                                إغلاق
                            </button>
                            <button
                                onClick={triggerSync}
                                disabled={!isOnline || isSyncing}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-md transition-all"
                            >
                                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                                <span>{isSyncing ? 'جاري المزامنة مع الخادم...' : 'مزامنة ورفع جميع الفواتير الآن'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
