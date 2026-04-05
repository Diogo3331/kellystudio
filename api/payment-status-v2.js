const { runNetlifyHandler } = require("./_netlify-bridge");
const { handler } = require("../netlify/functions/payment-status-v2");

module.exports = async (req, res) => {
  return runNetlifyHandler(req, res, handler);
};

