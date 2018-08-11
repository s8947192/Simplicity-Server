const app = require('../../server/server')

const stripeClient = require('stripe')('pk_test_U5zfDnUYzX2WoMAMA8BEqNM9')
const stripe = require('stripe')('sk_test_YVNd7kHmQsZv3jrQYNlQPIQV')

module.exports = function(CustomUser) {

  CustomUser.observe('before save', async function(ctx) {

    const {
      StripeService
    } = app.models

    const {
      email,
      username,
      pricing_plan
    } = ctx.instance

    const token = await stripeClient.tokens.create({
      card: {
        number: '4000000000000077',
        exp_month: 12,
        exp_year: 2019,
        cvc: '123',
        name: 'USER 1'
      },
      email: email
    })

    let newCustomer = null

    try {

      console.log('checking email...')
      const takenEmail = await CustomUser.findOne({ where: { email } })
      if (takenEmail) throw Error(`email ${email} has already been taken`)

      console.log('checking username...')
      const takenUsername = await CustomUser.findOne({ where: { username } })
      if (takenUsername) throw Error(`username ${username} has already been taken`)

      console.log('checking customer...')
      const existedCustomer = await StripeService.getCustomerByEmail(email)
      if (existedCustomer) throw Error(`customer ${email} has already been registered`)

      console.log('creating new customer...')
      newCustomer = await StripeService.createCustomer(email)

      console.log('adding payment source...')
      const paymentSource = await StripeService.createSource(newCustomer.id, token.id)

      console.log('setting default payment source...')
      await StripeService.setDefaultSource(newCustomer.id, paymentSource.id)

      console.log('subscripbing...')
      await StripeService.subscribe(newCustomer.id, pricing_plan)

      console.log('starting registration...')
      await ['token', 'pricing_plan'].forEach(field => ctx.instance.unsetAttribute(field))

    } catch (err) {
      console.log('cancelling registration...')
      if (newCustomer) await StripeService.deleteCustomer(newCustomer.id)
      return Promise.reject(err.message)
    }
  })
}
