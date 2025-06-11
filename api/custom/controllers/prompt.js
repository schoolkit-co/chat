/**
 * Create combined query for prompt groups
 * @param {object} query - Base query object
 * @param {object} project - Project object with promptGroupIds
 * @param {object} req - Request object with user information
 * @param {boolean} searchSharedOnly - Whether to search only shared prompts
 * @returns {object} Combined query object
 */
const createCombinedPromptQuery = (query, project, req, searchSharedOnly) => {
  let combinedQuery = query;
  
  // Create query for global shared prompts
  let globalSharedQuery = {};
  if (project && project.promptGroupIds && project.promptGroupIds.length > 0) {
    globalSharedQuery = { _id: { $in: project.promptGroupIds }, ...query };
    delete globalSharedQuery.author;
  }

  // Create query for school shared prompts if user has a school
  let schoolSharedQuery = {};
  if (req.user && req.user.school) {
    schoolSharedQuery = { schoolId: req.user.school, ...query };
    delete schoolSharedQuery.author;
  }

  // Combine queries based on what we're searching for
  if (searchSharedOnly) {
    if (Object.keys(globalSharedQuery).length > 0 && Object.keys(schoolSharedQuery).length > 0) {
      combinedQuery = { $or: [globalSharedQuery, schoolSharedQuery] };
    } else if (Object.keys(globalSharedQuery).length > 0) {
      combinedQuery = globalSharedQuery;
    } else if (Object.keys(schoolSharedQuery).length > 0) {
      combinedQuery = schoolSharedQuery;
    }
  } else {
    if (Object.keys(globalSharedQuery).length > 0 && Object.keys(schoolSharedQuery).length > 0) {
      combinedQuery = { $or: [globalSharedQuery, schoolSharedQuery, query] };
    } else if (Object.keys(globalSharedQuery).length > 0) {
      combinedQuery = { $or: [globalSharedQuery, query] };
    } else if (Object.keys(schoolSharedQuery).length > 0) {
      combinedQuery = { $or: [schoolSharedQuery, query] };
    }
  }

  return combinedQuery;
};

module.exports = {
  createCombinedPromptQuery,
};