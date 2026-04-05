const { runNetlifyHandler } = require("./_netlify-bridge");
const { handler } = require("../netlify/functions/mp-diagnostic");

module.exports = async (req, res) => {
  return runNetlifyHandler(req, res, handler);
};

