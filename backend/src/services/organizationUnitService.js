const {
  createOrganizationUnit,
  getOrganizationUnits,
  getOrganizationUnitById
} = require("../repositories/organizationUnitRepository");
async function createUnit({
  companyId,
  parentUnitId,
  name,
  type,
  description
}, user) {

  if (user.company_id !== companyId) {
    throw new Error("COMPANY_ACCESS_DENIED");
  }

  if (parentUnitId) {
    const parentUnit = await getOrganizationUnitById(
      parentUnitId,
      user.company_id
    );

    if (!parentUnit) {
      throw new Error("PARENT_UNIT_NOT_FOUND");
    }
  }

  return await createOrganizationUnit({
    companyId,
    parentUnitId,
    name,
    type,
    description
  });
}
async function getUnits(user) {
  return await getOrganizationUnits(user.company_id);
}
module.exports = {
  createUnit,
  getUnits
};