const develop = {
  inventoryMovementUrl:
    'https://4gm7sd0soe.execute-api.us-east-1.amazonaws.com/dev/inventory-movements',
  invoiceUrl:
    'https://auf9sd3ft5.execute-api.us-east-1.amazonaws.com/dev/invoices',
  productUrl:
    'https://pgs3yitu93.execute-api.us-east-1.amazonaws.com/dev/products',
  projectUrl:
    'https://ekxeyrhvhh.execute-api.us-east-1.amazonaws.com/dev/projects',
  purchaseUrl:
    'https://ezx8vhace8.execute-api.us-east-1.amazonaws.com/dev/purchases',
  saleUrl: 'https://v8z8ctg7ta.execute-api.us-east-1.amazonaws.com/dev/sales',
  serviceUrl:
    'https://ac5n79hsk1.execute-api.us-east-1.amazonaws.com/dev/services',
  stakeholderUrl:
    'https://v5xx70s4r6.execute-api.us-east-1.amazonaws.com/dev/stakeholders',
  usersUrl: 'https://oj41d9rbdi.execute-api.us-east-1.amazonaws.com/dev/users',
  repairsUrl:
    'https://tqd5wf5c3i.execute-api.us-east-1.amazonaws.com/dev/repairs',
  reportUrl:
    'https://ueuvc1n3sg.execute-api.us-east-1.amazonaws.com/dev/reports',
  paymentsUrl:
    'https://kqanan1fy6.execute-api.us-east-1.amazonaws.com/dev/payments',
  invoiceFelUrl:
    'https://0ec3y7nkgk.execute-api.us-east-1.amazonaws.com/dev/invoicefel',
  manualPaymentsUrl:
    'https://xtn5pannz9.execute-api.us-east-1.amazonaws.com/dev/manualpayments',
}

const production = {
  inventoryMovementUrl:
    'https://u1bf8sdlpl.execute-api.us-east-1.amazonaws.com/prod/inventory-movements',
  invoiceUrl:
    'https://uj4q9nrnz9.execute-api.us-east-1.amazonaws.com/prod/invoices',
  productUrl:
    'https://9ht6rmmxbb.execute-api.us-east-1.amazonaws.com/prod/products',
  projectUrl:
    'https://mb2awyvv0h.execute-api.us-east-1.amazonaws.com/prod/projects',
  purchaseUrl:
    'https://f204t59ap7.execute-api.us-east-1.amazonaws.com/prod/purchases',
  saleUrl: 'https://ptti3zm1y5.execute-api.us-east-1.amazonaws.com/prod/sales',
  serviceUrl:
    'https://adqyzj2wn8.execute-api.us-east-1.amazonaws.com/prod/services',
  stakeholderUrl:
    'https://97bujz55j5.execute-api.us-east-1.amazonaws.com/prod/stakeholders',
  usersUrl: 'https://aelcxzmxn8.execute-api.us-east-1.amazonaws.com/prod/users',
  repairsUrl:
    'https://dpznpcmbf9.execute-api.us-east-1.amazonaws.com/prod/repairs',
  reportUrl:
    'https://m0d4cx91pb.execute-api.us-east-1.amazonaws.com/prod/reports',
  paymentsUrl:
    'https://x03gt0xo95.execute-api.us-east-1.amazonaws.com/prod/payments',
  invoiceFelUrl:
    'https://j9lig5lwvl.execute-api.us-east-1.amazonaws.com/prod/invoicefel',
  manualPaymentsUrl:
    'https://jt7d866tn7.execute-api.us-east-1.amazonaws.com/prod/manualpayments',
}

const enviroment = env => {
  switch (env) {
    case 'develop':
      return develop
    case 'production':
      return production
    default:
      return null
  }
}

module.exports = {
  stage: enviroment('production'),
}
