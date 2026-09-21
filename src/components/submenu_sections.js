const submenu_sections = [
  // {
  //   name: 'Historial maquinas',
  //   key: 'reportMachineHistory',
  //   route: '/reportMachineHistory',
  //   component: (
  //     <>
  //       <h1>Historial Maquinas</h1>
  //     </>
  //   ),
  // },
  {
    name: 'Inventario',
    key: 'reportInventory',
    route: '/reportInventory',
    component: (
      <>
        <h1>Inventario</h1>
      </>
    ),
  },
  {
    name: 'Cta. Clientes',
    key: 'reportAccountClient',
    route: '/reportAccountClient',
    component: (
      <>
        <h1>Estado cuenta clientes</h1>
      </>
    ),
  },
  // {
  //   name: 'Cuentas por cobrar',
  //   key: 'reportAccountsReceivable',
  //   route: '/reportAccountsReceivable',
  //   component: (
  //     <>
  //       <h1>Cuentas por cobrar</h1>
  //     </>
  //   ),
  // },
  // {
  //   name: 'Equipo / Servicio',
  //   key: 'report_equipment_service',
  //   route: '/reportEquipmentService',
  //   component: (
  //     <>
  //       <h1>Equipo / Servicio</h1>
  //     </>
  //   ),
  // },
  {
    name: 'Facturas',
    key: 'reportMonthlyBill',
    route: '/reportMonthlyBill',
    component: (
      <>
        <h1>Factura</h1>
      </>
    ),
  },
  {
    name: 'Recibos de caja',
    key: 'reportCasReceipts',
    route: '/reportCasReceipts',
    component: (
      <>
        <h1>Recibos</h1>
      </>
    ),
  },
  {
    name: 'Recibos',
    key: 'reportManualCasReceipts',
    route: '/reportManualCasReceipts',
    component: (
      <>
        <h1>Recibo manual</h1>
      </>
    ),
  },
  // {
  //   name: 'Envios',
  //   key: 'reportShipping',
  //   route: '/reportShipping',
  //   component: (
  //     <>
  //       <h1>Envios por cliente</h1>
  //     </>
  //   ),
  // },
  {
    name: 'Ordenes de servicio',
    key: 'reportSales',
    route: '/reportSales',
    component: (
      <>
        <h1>Ventas por vendedor y rango</h1>
      </>
    ),
  },
  {
    name: 'Productos Ventas',
    key: 'reportSalesProduct',
    route: '/reportSalesProduct',
    component: (
      <>
        <h1>Ventas de productos</h1>
      </>
    ),
  },
  {
    name: 'Comisiones',
    key: 'reportCommissions',
    route: '/reportCommissions',
    component: (
      <>
        <h1>Comisiones</h1>
      </>
    ),
  },
]

const submenu_sections_inventory = [
  {
    name: 'Servicios',
    key: 'inventoryServices',
    route: '/inventoryServices',
    component: (
      <>
        <h1>Servicios</h1>
      </>
    ),
  },
  {
    name: 'Productos',
    key: 'inventoryProducts',
    route: '/inventoryProducts',
    component: (
      <>
        <h1>Productos</h1>
      </>
    ),
  },
  {
    name: 'Movimientos',
    key: 'inventoryMovements',
    route: '/inventoryMovements',
    component: (
      <>
        <h1>Movimientos</h1>
      </>
    ),
  },
  {
    name: 'Ajustes',
    key: 'inventoryAdjustment',
    route: '/inventoryAdjustment',
    component: (
      <>
        <h1>Ajustes de Inventario</h1>
      </>
    ),
  },
]

export { submenu_sections, submenu_sections_inventory }
