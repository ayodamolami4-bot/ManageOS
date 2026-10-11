const {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal
} = require("../repositories/goalRepository");

async function createNewGoal({
  title,
  description,
  status,
  priority,
  startDate,
  dueDate
}, user) {
  return await createGoal({
    companyId: user.company_id,
    title,
    description,
    status: status || "PLANNED",
    priority: priority || "MEDIUM",
    startDate,
    dueDate,
    createdBy: user.id
  });
}

async function getCompanyGoals(user) {
  return await getGoals(user.company_id);
}

async function getGoal(goalId, user) {
  const goal = await getGoalById(
    user.company_id,
    goalId
  );

  if (!goal) {
    throw new Error("GOAL_NOT_FOUND");
  }

  return goal;
}

async function updateExistingGoal({
  goalId,
  title,
  description,
  status,
  priority,
  startDate,
  dueDate
}, user) {
  const existingGoal = await getGoalById(
    user.company_id,
    goalId
  );

  if (!existingGoal) {
    throw new Error("GOAL_NOT_FOUND");
  }

  return await updateGoal({
    companyId: user.company_id,
    goalId,
    title,
    description,
    status,
    priority,
    startDate,
    dueDate
  });
}

async function deleteExistingGoal(goalId, user) {
  const existingGoal = await getGoalById(
    user.company_id,
    goalId
  );

  if (!existingGoal) {
    throw new Error("GOAL_NOT_FOUND");
  }

  return await deleteGoal(
    user.company_id,
    goalId
  );
}

module.exports = {
  createNewGoal,
  getCompanyGoals,
  getGoal,
  updateExistingGoal,
  deleteExistingGoal
};