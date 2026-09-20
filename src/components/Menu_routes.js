//users
import Users from '../pages/users/usersIndex'
import UsersView from '../pages/users/userView'

// Sales
import Sales from '../pages/sales/salesIndex'
import ServiceNoteView from '../pages/sales/components/serviceNote/serviceNoteView'
import ServiceNoteBill from '../pages/sales/components/serviceNote/ServiceNoteBill'

//Clients
import Clients from '../pages/clients/clientsIndex'
import ClientView from '../pages/clients/clientView'

//Sellers
import Sellers from '../pages/sellers/sellersIndex'

//Suppliers
import Suppliers from '../pages/suppliers/suppliersIndex'
import SupplierView from '../pages/suppliers/supplierView'

//Inventory

import Products from '../pages/inventory/products/productIndex'
import ProductView from '../pages/inventory/products/components/productView'

import Services from '../pages/inventory/services/serviceIndex'
import ServiceView from '../pages/inventory/services/serviceVIew'

import InventoryMovement from '../pages/inventory/inventoryMovement/inventoryMovementIndex'
import InventoryMovementView from '../pages/inventory/inventoryMovement/components/inventoryMovementView'

import InventoryAdjustment from '../pages/inventory/inventoryAdjustment/inventoryAdjustmentIndex'
import InventoryAdjustmentView from '../pages/inventory/inventoryAdjustment/components/inventoryAdjustmentView'

// Repairs
import Repairs from '../pages/repairs/repairsIndex'
import RepairsView from '../pages/repairs/repairsView'

//Reports
import ReportMachine from '../pages/reports/reportMachine/reportMachineIndex'
import ReportInventory from '../pages/reports/reportInventory/reportInventoryIndex'
import ReportClient from '../pages/reports/reportClient/reportClientIndex'
import ReportAccountsReceivable from '../pages/reports/reportAccountsReceivable/reportAccountsReceivableIndex'
//import ReportSales from '../pages/reports/reportSales/reportSalesIndex'
/*new reports*/
import ReportDocuments from '../pages/reports/reportDocuments/reportDocumentsIndex'
import ReportCashReceipts from '../pages/reports/reportCashReceipts/reportCashReceiptsIndex'
import ReportManualCashReceipts from '../pages/reports/reportManualCashReceipts/reportManualCashReceiptsIndex'
import ReportServiceOrders from '../pages/reports/reportServiceOrders/reportServiceOrdersIndex'
import reportSalesProduct from '../pages/reports/reportSalesProduct/reportSalesProductIndex'

//billing
import Billing from '../pages/billing/billingIndex'
import BillingView from '../pages/billing/billingView'

//billingOld
import BillingOld from '../pages/billingOld/billingIndexOld'
import BillingViewOld from '../pages/billingOld/billingViewOld'

//payments
import Payments from '../pages/payments/paymentsIndex'
import manualPayments from '../pages/manualPayment/manualPaymentsIndex'

//billing management
import BillingManagementIndex from '../pages/billingManagement/billingManagementIndex'

import genericPage from '../pages/genericPage'

import {
  submenu_sections,
  submenu_sections_inventory,
} from './submenu_sections'

//welcome
import welcomePage from '../pages/welcomePage'

const menu_routes = [
  {
    id: 0,
    name: 'Welcome',
    key: 'welcome',
    icon: 'users',
    route: '/welcome',
    profilePermissions: [5],
    routeGroup: [/^(\/welcome)|(\/welcome\/)/i],
  },
  {
    id: 2,
    name: 'Usuarios',
    key: 'users',
    icon: 'users',
    route: '/users',
    profilePermissions: [5],
    routeGroup: [
      /^(\/users)|(\/users\/)|(\/userView)|(\/userView\/)|(\/userView\/[a-zA-z0-9]*)/i,
    ],
  },
  {
    id: 7,
    name: 'Clientes',
    key: 'clients',
    icon: 'clients',
    route: '/clients',
    profilePermissions: [61],
    routeGroup: [
      /^(\/clients)|(\/clients\/)|(\/clientView)|(\/clientView\/)|(\/clientView\/[a-zA-z0-9]*)/i,
    ],
  },
  {
    id: 8,
    name: 'Proveedores',
    key: 'suppliers',
    icon: 'suppliers',
    route: '/suppliers',
    profilePermissions: [61],
    routeGroup: [
      /^(\/suppliers)|(\/suppliers\/)|(\/supplierView)|(\/supplierView\/)|(\/supplierView\/[a-zA-z0-9]*)/i,
    ],
  },
  {
    id: 6,
    name: 'Vendedores',
    key: 'sellers',
    icon: 'clients',
    route: '/sellers',
    profilePermissions: [53],
    routeGroup: [/^(\/sellers)|(\/sellers\/)/i],
  },
  {
    id: 9,
    name: 'Reparaciones',
    key: 'repairs',
    icon: 'cashRegister',
    route: '/repairs',
    profilePermissions: [25],
    routeGroup: [
      /^(\/repairs)|(\/repairs\/)|(\/repairsView)|(\/repairsView\/[a-zA-z0-9]*)/i,
    ],
  },
  {
    id: 5,
    name: 'Inventario',
    key: 'inventory',
    icon: 'products',
    route: '/inventory',
    profilePermissions: [25],
    routeGroup: [
      /^(\/inventoryServices)|(\/inventoryServicesView)|(\/inventoryProducts)|(\/inventoryProductsView)|(\/inventoryMovements)|(\/InventoryMovementsView)|(\/inventoryAdjustment)|(\/InventoryAdjustmentView)/i,
    ],
    sub_menu: submenu_sections_inventory,
  },
  {
    id: 6,
    name: 'Ventas',
    key: 'sales',
    icon: 'pos',
    route: '/sales',
    profilePermissions: [53],
    routeGroup: [
      /^(\/sales)|(\/sales\/)|(\/serviceNoteView)|(\/ServiceNoteBill)/i,
    ],
  },
  {
    id: 4,
    name: 'Facturacion',
    key: 'billing',
    icon: 'inventory',
    route: '/billing',
    profilePermissions: [9],
    routeGroup: [
      /^(\/billing)|(\/billing\/)|(\/billingView)|(\/billingView\/)|(\/billingView\/[a-zA-z0-9]*)/i,
    ],
  },  
  {
    id: 11,
    name: 'Fact. Sistema',
    key: 'FactOld',
    icon: 'inventory',
    route: '/FactOld',
    profilePermissions: [9],
    routeGroup: [
      /^(\/FactOld)|(\/FactOld\/)|(\/FactViewOld)|(\/FactViewOld\/)|(\/FactViewOld\/[a-zA-z0-9]*)/i,
    ],
  },
  {
    id: 13,
    name: 'Admin Factura',
    key: 'billManagement',
    icon: 'inventory',
    route: '/billManagement',
    profilePermissions: [9],
    routeGroup: [/^(\/billManagement)|(\/billManagement\/)/i],
  },
  {
    id: 10,
    name: 'Recibo de caja',
    key: 'payments',
    icon: 'inventory',
    route: '/payments',
    profilePermissions: [10],
    routeGroup: [/^(\/payments)|(\/payments\/)/i],
  },
  {
    id: 12,
    name: 'Recibos',
    key: 'manualPayments',
    icon: 'inventory',
    route: '/manualPayments',
    profilePermissions: [10],
    routeGroup: [/^(\/manualPayments)|(\/manualPayments\/)/i],
  },
  {
    id: 3,
    name: 'Reportes',
    key: 'reports',
    icon: 'cashRegister',
    route: '/reports',
    profilePermissions: [53],
    routeGroup: [
      /^(\/reportInventory)|(\/reportSalesProduct)|(\/reportAccountsReceivable)|(\/reportAccountClient)|(\/reportEquipmentService)|(\/reportCasReceipts)|(\/reportManualCasReceipts)|(\/reportMonthlyBill)|(\/reportShipping)|(\/reportSales)|(\/reportCommissions)|(\/reportCostSellingEquipment)/i,
    ],
    sub_menu: submenu_sections,
  }  
]

const menu_sub_routes = [
  {
    id: 2,
    route: '/users',
    component: Users,
  },
  {
    id: 2,
    route: '/userView',
    component: UsersView,
  },
  {
    id: 7,
    route: '/clients',
    component: Clients,
  },
  {
    id: 7,
    route: '/clientView',
    component: ClientView,
  },
  {
    id: 8,
    route: '/suppliers',
    component: Suppliers,
  },
  {
    id: 8,
    route: '/supplierView',
    component: SupplierView,
  },
  {
    id: 6,
    route: '/sellers',
    component: Sellers,
  },
  {
    id: 9,
    route: '/repairs',
    component: Repairs,
  },
  {
    id: 9,
    route: '/repairsView',
    component: RepairsView,
  },
  {
    id: 6,
    route: '/sales',
    component: Sales,
  },
  {
    id: 6,
    route: '/serviceNoteView',
    component: ServiceNoteView,
  },
  {
    id: 6,
    route: '/ServiceNoteBill',
    component: ServiceNoteBill,
  },
  {
    id: 5,
    route: '/inventoryProducts',
    component: Products,
  },
  {
    id: 5,
    route: '/inventoryProductsView',
    component: ProductView,
  },
  {
    id: 5,
    route: '/inventoryServices',
    component: Services,
  },
  {
    id: 5,
    route: '/inventoryServicesView',
    component: ServiceView,
  },
  {
    id: 5,
    route: '/inventoryMovements',
    component: InventoryMovement,
  },
  {
    id: 5,
    route: '/InventoryMovementsView',
    component: InventoryMovementView,
  },
  {
    id: 5,
    route: '/inventoryAdjustment',
    component: InventoryAdjustment,
  },
  {
    id: 5,
    route: '/InventoryAdjustmentView',
    component: InventoryAdjustmentView,
  },
  {
    id: 4,
    route: '/billing',
    component: Billing,
  },
  {
    id: 4,
    route: '/billingView',
    component: BillingView,
  },
  {
    id: 10,
    route: '/payments',
    component: Payments,
  },
  {
    id: 3,
    route: '/reportMachineHistory',
    component: ReportMachine,
  },
  {
    id: 3,
    route: '/reportInventory',
    component: ReportInventory,
  },
  {
    id: 3,
    route: '/reportAccountClient',
    component: ReportClient,
  },
  {
    id: 3,
    route: '/reportAccountsReceivable',
    component: ReportAccountsReceivable,
  },
  {
    id: 3,
    route: '/reportEquipmentService',
    component: genericPage,
  },
  {
    id: 3,
    route: '/reportMonthlyBill',
    component: ReportDocuments,
  },
  {
    id: 3,
    route: '/reportCasReceipts',
    component: ReportCashReceipts,
  },
  {
    id: 3,
    route: '/reportManualCasReceipts',
    component: ReportManualCashReceipts,
  },
  {
    id: 3,
    route: '/reportShipping',
    component: genericPage,
  },
  {
    id: 3,
    route: '/reportSales',    
    component: ReportServiceOrders,
  },
  {
    id: 3,
    route: '/reportCommissions',
    component: genericPage,
  },
  {
    id: 3,
    route: '/reportSalesProduct',
    component: reportSalesProduct,
  },
  {
    id: 3,
    route: '/reportCostSellingEquipment',
    component: genericPage,
  },
  {
    id: 0,
    route: '/welcome',
    component: welcomePage,
  },
  {
    id: 11,
    route: '/FactOld',
    component: BillingOld,
  },
  {
    id: 11,
    route: '/FactViewOld',
    component: BillingViewOld,
  },
  {
    id: 12,
    route: '/manualPayments',
    component: manualPayments,
  },
  {
    id: 13,
    route: '/billManagement',
    component: BillingManagementIndex,
  },
]
export { menu_routes, menu_sub_routes }
