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
      app.io.emit('registration', 'validating email')
      const takenEmail = await CustomUser.findOne({ where: { email } })
      if (takenEmail) throw Error(`email ${email} has already been taken`)

      app.io.emit('registration', 'validating username')
      const takenUsername = await CustomUser.findOne({ where: { username } })
      if (takenUsername) throw Error(`username ${username} has already been taken`)

      app.io.emit('registration', 'validating customer')
      const existedCustomer = await StripeService.getCustomerByEmail(email)
      if (existedCustomer) throw Error(`customer ${email} has already been registered`)

      app.io.emit('registration', 'creating new customer')
      newCustomer = await StripeService.createCustomer(email)

      if (token) {
        app.io.emit('registration', 'saving payment source')
        const paymentSource = await StripeService.createSource(newCustomer.id, token)

        app.io.emit('registration', 'settings default payment source')
        await StripeService.setDefaultSource(newCustomer.id, paymentSource.id)
      }

      app.io.emit('registration', 'subscribing user to selected plan')
      await StripeService.subscribe(newCustomer.id, pricing_plan)

      app.io.emit('registration', 'creating new user instance')
      await ['token', 'pricing_plan'].forEach(field => ctx.instance.unsetAttribute(field))

    } catch (err) {
      app.io.emit('registration', 'cancel registration')
      if (newCustomer) await StripeService.deleteCustomer(newCustomer.id)
      return Promise.reject(err)
    }
  })

  CustomUser.observe('after save', async function(ctx) {
    app.io.emit('registration', 'registration has successfully been completed')
  })
}
