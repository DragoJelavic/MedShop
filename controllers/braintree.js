const braintree = require('braintree');
require('dotenv')
  .config();

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

exports.generateToken = (req, res) => {
  gateway.clientToken.generate({}, (err, response) => {
    if (err) {
      res.status(500)
        .send(err);
    } else {
      res.send(response);
    }
  });
};

exports.processPayment = (req, res) => {
  const nonceFromTheClient = req.body.paymentMethodNonce;
  const amountFromTheClient = req.body.amount;
  gateway.transaction.sale(
    {
      amount: amountFromTheClient,
      paymentMethodNonce: nonceFromTheClient,
      options: {
        submitForSettlement: true,
      },
    },
    (error, newTransaction) => {
      if (error) {
        res.status(500).json(error);
      } else {
        res.json(newTransaction);
      }
    },
  );
};
