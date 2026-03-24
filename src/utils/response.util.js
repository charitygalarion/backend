// Transform Sequelize model to MongoDB-style response (id -> _id)
const transformResponse = (data) => {
  if (!data) return null;
  
  // Handle array
  if (Array.isArray(data)) {
    return data.map(item => transformResponse(item));
  }
  
  // Handle Sequelize instance
  const obj = data.toJSON ? data.toJSON() : { ...data };
  
  // Convert id to _id
  if (obj.id && !obj._id) {
    obj._id = obj.id;
    delete obj.id;
  }
  
  // Map database column names to frontend expected names
  // This ensures prep_time becomes prepTime, etc.
  if (obj.prep_time !== undefined && obj.prepTime === undefined) {
    obj.prepTime = obj.prep_time;
  }
  if (obj.cook_time !== undefined && obj.cookTime === undefined) {
    obj.cookTime = obj.cook_time;
  }
  if (obj.meal_type !== undefined && obj.mealType === undefined) {
    obj.mealType = obj.meal_type;
  }
  if (obj.created_by !== undefined && obj.createdBy === undefined) {
    obj.createdBy = obj.created_by;
  }
  if (obj.is_filipino !== undefined && obj.isFilipino === undefined) {
    obj.isFilipino = obj.is_filipino;
  }
  
  // Remove Sequelize metadata
  delete obj.createdAt;
  delete obj.updatedAt;
  delete obj.deletedAt;
  delete obj.prep_time;
  delete obj.cook_time;
  delete obj.meal_type;
  delete obj.created_by;
  delete obj.is_filipino;
  
  return obj;
};

// Format success response
const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    ...(data && { ...transformResponse(data) })
  };
};

// Format error response 
const errorResponse = (message, statusCode = 500) => {
  return {
    success: false,
    message,
    statusCode
  };
};

module.exports = { transformResponse, successResponse, errorResponse };