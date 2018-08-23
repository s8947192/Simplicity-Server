'use strict'

const stripe = require('stripe')('sk_test_YVNd7kHmQsZv3jrQYNlQPIQV')

module.exports = function(StripeService) {

  StripeService.getProducts = () =>
    stripe.products.list({ type: 'service' }).then(products => products.data)

  StripeService.getPlans = () =>
    stripe.plans.list({ limit: 100 }).then(plans => plans.data)

  StripeService.getSubscriptions = () =>
    stripe.subscriptions.list()

  StripeService.getCoupons = () =>
    stripe.coupons.list()

  StripeService.getCustomerByEmail = email =>
    stripe.customers.list({ limit: 1, email })
      .then(customers => customers.data[0])

  StripeService.createCustomer = email =>
    stripe.customers.create({ email })

  StripeService.deleteCustomer = customerId =>
    stripe.customers.del(customerId)

  StripeService.createSource = (customerId, sourceId) =>
    stripe.customers.createSource(customerId, { source: sourceId })

  StripeService.setDefaultSource = (customerId, sourceId) =>
    stripe.customers.update(customerId, { default_source: sourceId })

  StripeService.subscribe = (customer, plan, coupon) =>
    stripe.subscriptions.create({ customer, coupon, items: [{ plan: plan }] })

  StripeService.remoteMethod('getProducts', {
    http: { verb: 'get' },
    returns: { arg: 'products', type: 'object' }
  })

  StripeService.remoteMethod('getPlans', {
    http: { verb: 'get' },
    returns: { arg: 'plans', type: 'object' }
  })
}

// const stripeClient = require('stripe')('pk_test_U5zfDnUYzX2WoMAMA8BEqNM9')

// StripeService.charge = async function(msg, cb) {
//   const token = await stripeClient.tokens.create({
//     card: {
//       number: '4242424242424242',
//       exp_month: 12,
//       exp_year: 2019,
//       cvc: '123',
//       name: 'USER 1'
//     },
//     email: 'frostberryart@gmail.com'
//   })
//
//   const plans = await stripe.plans.list()
//   const coupons = await stripe.coupons.list()
//   const subscriptions = await stripe.subscriptions.list()
//
//   const customer = await stripe.customers.create({
//     email: token.email
//   })
//
//   const source = await stripe.customers.createSource(customer.id, {
//     source: token.id
//   })
//
//   const defaultSource = await stripe.customers.update(customer.id, {
//     default_source: source.id
//   })
//
//   const subscription = await stripe.subscriptions.create({
//     customer: customer.id,
//     coupon: coupons.data[0].id,
//     items: [{ plan: plans.data[0].id }]
//   })
//   return 'DONE'
// }
