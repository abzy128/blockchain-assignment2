const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("AiModelContract", (m) => {
  const aiModel = m.contract("AiModelContract");
  return { aiModel };
});
1