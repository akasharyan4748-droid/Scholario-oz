// Vendor & Procurement data — suppliers, POs, GRNs, contracts

export interface Vendor {
  id: string
  name: string
  category: string
  contact: string
  phone: string
  email: string
  gstin: string
  rating: number
  totalOrders: number
  totalValue: number
  pendingPayment: number
  status: 'Active' | 'On Hold' | 'Blacklisted'
  onTimeRate: number
  gradient: string
}

export const vendors: Vendor[] = [
  { id: 'V01', name: 'Sunrise Stationery Mart', category: 'Stationery', contact: 'Rakesh Verma', phone: '+91 98100 11111', email: 'rakesh@sunrisestationery.in', gstin: '06AABCS1234L1Z5', rating: 4.6, totalOrders: 48, totalValue: 1240000, pendingPayment: 84000, status: 'Active', onTimeRate: 94, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'V02', name: 'Sharma Furniture House', category: 'Furniture', contact: 'Mukesh Sharma', phone: '+91 98200 22222', email: 'mukesh@sharmafurniture.in', gstin: '07AABCS5678M1Z2', rating: 4.4, totalOrders: 22, totalValue: 2840000, pendingPayment: 0, status: 'Active', onTimeRate: 88, gradient: 'from-amber-500 to-orange-600' },
  { id: 'V03', name: 'TechLab Equipments Pvt Ltd', category: 'Lab Equipment', contact: 'Suresh Iyer', phone: '+91 98300 33333', email: 'suresh@techlab.co.in', gstin: '29AALCT9012P1Z7', rating: 4.8, totalOrders: 16, totalValue: 1860000, pendingPayment: 142000, status: 'Active', onTimeRate: 96, gradient: 'from-cyan-500 to-sky-600' },
  { id: 'V04', name: 'BlueStar IT Solutions', category: 'Electronics', contact: 'Priya Nair', phone: '+91 98400 44444', email: 'priya@bluestarit.in', gstin: '27AABCB3456N1Z9', rating: 4.5, totalOrders: 12, totalValue: 2240000, pendingPayment: 0, status: 'Active', onTimeRate: 91, gradient: 'from-violet-500 to-purple-600' },
  { id: 'V05', name: 'GreenFields Sports Co.', category: 'Sports', contact: 'Arjun Reddy', phone: '+91 98500 55555', email: 'arjun@greenfields.in', gstin: '36AABCG7890R1Z3', rating: 4.3, totalOrders: 18, totalValue: 960000, pendingPayment: 48000, status: 'Active', onTimeRate: 85, gradient: 'from-lime-500 to-green-600' },
  { id: 'V06', name: 'Anand Uniforms & Textiles', category: 'Uniforms', contact: 'Deepak Anand', phone: '+91 98600 66666', email: 'deepak@ananduniforms.in', gstin: '24AABCA4567S1Z8', rating: 4.1, totalOrders: 8, totalValue: 680000, pendingPayment: 0, status: 'On Hold', onTimeRate: 72, gradient: 'from-rose-500 to-pink-600' },
  { id: 'V07', name: 'QuickDel Logistics', category: 'Transport', contact: 'Manoj Gupta', phone: '+91 98700 77777', email: 'manoj@quickdel.in', gstin: '09AABCD1234Q1Z6', rating: 4.7, totalOrders: 124, totalValue: 420000, pendingPayment: 12000, status: 'Active', onTimeRate: 98, gradient: 'from-indigo-500 to-blue-600' },
]

export interface PurchaseOrder {
  id: string
  poNo: string
  vendor: string
  category: string
  items: number
  amount: number
  orderDate: string
  expectedDate: string
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Delivered' | 'Partial' | 'Cancelled'
  approvedBy?: string
}

export const purchaseOrders: PurchaseOrder[] = [
  { id: 'PO01', poNo: 'PO-2024-0142', vendor: 'Sunrise Stationery Mart', category: 'Stationery', items: 24, amount: 84000, orderDate: '2024-11-25', expectedDate: '2024-12-02', status: 'Approved', approvedBy: 'Dr. Ananya Iyer' },
  { id: 'PO02', poNo: 'PO-2024-0143', vendor: 'TechLab Equipments Pvt Ltd', category: 'Lab Equipment', items: 8, amount: 142000, orderDate: '2024-11-22', expectedDate: '2024-12-10', status: 'Pending Approval' },
  { id: 'PO03', poNo: 'PO-2024-0140', vendor: 'Sharma Furniture House', category: 'Furniture', items: 12, amount: 280000, orderDate: '2024-11-15', expectedDate: '2024-11-28', status: 'Delivered', approvedBy: 'Dr. Ananya Iyer' },
  { id: 'PO04', poNo: 'PO-2024-0141', vendor: 'GreenFields Sports Co.', category: 'Sports', items: 18, amount: 48000, orderDate: '2024-11-20', expectedDate: '2024-11-30', status: 'Partial', approvedBy: 'Sanjay Reddy' },
  { id: 'PO05', poNo: 'PO-2024-0139', vendor: 'BlueStar IT Solutions', category: 'Electronics', items: 6, amount: 320000, orderDate: '2024-11-10', expectedDate: '2024-11-25', status: 'Delivered', approvedBy: 'Dr. Ananya Iyer' },
  { id: 'PO06', poNo: 'PO-2024-0144', vendor: 'Anand Uniforms & Textiles', category: 'Uniforms', items: 240, amount: 180000, orderDate: '2024-11-28', expectedDate: '2024-12-15', status: 'Draft' },
  { id: 'PO07', poNo: 'PO-2024-0138', vendor: 'QuickDel Logistics', category: 'Transport', items: 1, amount: 12000, orderDate: '2024-11-05', expectedDate: '2024-11-06', status: 'Delivered', approvedBy: 'Admin Office' },
  { id: 'PO08', poNo: 'PO-2024-0137', vendor: 'Sunrise Stationery Mart', category: 'Stationery', items: 16, amount: 36000, orderDate: '2024-10-28', expectedDate: '2024-11-05', status: 'Cancelled' },
]

export interface GoodsReceipt {
  id: string
  grnNo: string
  poNo: string
  vendor: string
  receivedDate: string
  itemsReceived: number
  itemsOrdered: number
  qualityCheck: 'Passed' | 'Partial' | 'Failed'
  receivedBy: string
  remarks?: string
}

export const goodsReceipts: GoodsReceipt[] = [
  { id: 'GR01', grnNo: 'GRN-2024-0089', poNo: 'PO-2024-0140', vendor: 'Sharma Furniture House', receivedDate: '2024-11-28', itemsReceived: 12, itemsOrdered: 12, qualityCheck: 'Passed', receivedBy: 'Store Keeper', remarks: 'All items in good condition' },
  { id: 'GR02', grnNo: 'GRN-2024-0088', poNo: 'PO-2024-0139', vendor: 'BlueStar IT Solutions', receivedDate: '2024-11-25', itemsReceived: 6, itemsOrdered: 6, qualityCheck: 'Passed', receivedBy: 'IT Admin', remarks: 'Projectors tested & installed' },
  { id: 'GR03', grnNo: 'GRN-2024-0087', poNo: 'PO-2024-0141', vendor: 'GreenFields Sports Co.', receivedDate: '2024-11-29', itemsReceived: 12, itemsOrdered: 18, qualityCheck: 'Partial', receivedBy: 'Sports Director', remarks: '6 footballs pending — backorder' },
  { id: 'GR04', grnNo: 'GRN-2024-0086', poNo: 'PO-2024-0138', vendor: 'QuickDel Logistics', receivedDate: '2024-11-06', itemsReceived: 1, itemsOrdered: 1, qualityCheck: 'Passed', receivedBy: 'Admin Office' },
]

export const procurementStats = {
  totalVendors: 47,
  activeVendors: 38,
  pendingPOs: 6,
  pendingApprovals: 1,
  monthlySpend: 1240000,
  ytdSpend: 14280000,
  pendingPayments: 286000,
  avgDeliveryTime: '8 days',
  monthlySpendTrend: [
    { month: 'Jul', amount: 980000 }, { month: 'Aug', amount: 1240000 },
    { month: 'Sep', amount: 860000 }, { month: 'Oct', amount: 1640000 },
    { month: 'Nov', amount: 1240000 }, { month: 'Dec', amount: 680000 },
  ],
  spendByCategory: [
    { name: 'Furniture', value: 2840000, color: 'oklch(0.65 0.16 75)' },
    { name: 'Electronics', value: 2240000, color: 'oklch(0.6 0.18 300)' },
    { name: 'Lab Equipment', value: 1860000, color: 'oklch(0.7 0.15 200)' },
    { name: 'Stationery', value: 1240000, color: 'oklch(0.55 0.14 162)' },
    { name: 'Sports', value: 960000, color: 'oklch(0.6 0.14 150)' },
    { name: 'Other', value: 1340000, color: 'oklch(0.5 0.01 160)' },
  ],
}
