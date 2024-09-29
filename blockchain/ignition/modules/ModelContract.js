const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ModelContract", (m) => {
  const aiModel = m.contract("ModelContract");

  return { aiModel };
});
1