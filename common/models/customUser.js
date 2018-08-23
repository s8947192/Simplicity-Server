const app = require('../../server/server')

module.exports = function(CustomUser) {

  CustomUser.observe('before save', async function(ctx) {
    const { StripeService } = app.models
    const {
      email,
      username,
      pricing_plan,
      token
    } = ctx.instance

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

      if (token) {
        console.log('adding payment source...')
        const paymentSource = await StripeService.createSource(newCustomer.id, token)

        console.log('setting default payment source...')
        await StripeService.setDefaultSource(newCustomer.id, paymentSource.id)
      }

      console.log('subscripbing...')
      await StripeService.subscribe(newCustomer.id, pricing_plan)

      console.log('starting registration...')
      await ['token', 'pricing_plan'].forEach(field => ctx.instance.unsetAttribute(field))

    } catch (err) {
      console.log('cancelling registration...')
      if (newCustomer) await StripeService.deleteCustomer(newCustomer.id)
      return Promise.reject(err)
    }
  })

  CustomUser.observe('after save', async function(ctx) {
    console.log('registration completed...')
  })
}
